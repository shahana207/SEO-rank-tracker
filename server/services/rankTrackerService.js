import { chromium } from "playwright-core";
import Browserbase from "@browserbasehq/sdk";

const bb = new Browserbase({
  apiKey: process.env.BROWSERBASE_API_KEY,
});

export async function rankTracker(keyword, targetDomain) {
  let browser;

  try {
    // 1. Create Browserbase session
    const session = await bb.sessions.create({
      browserSettings: {
        blockAds: true,
      },
    });

    browser = await chromium.connectOverCDP(session.connectUrl);

    const context = browser.contexts()[0];
    const pages = context.pages();

    const page = pages.length
      ? pages[0]
      : await context.newPage();

    page.setDefaultNavigationTimeout(45000);

    // 2. Initial Google visit and consent handling
    await page.goto("https://www.google.com", {
      waitUntil: "networkidle",
    });

    try {
      const btn = await page.$(
        'button#L2AGLB, form[action*="consent"] button'
      );

      if (btn) {
        await btn.click();
        await page.waitForTimeout(1500);
      }
    } catch (error) {
      // Continue if consent is not shown
    }

    let found = null;
    let allResults = [];

    const cleanTarget = targetDomain
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]
      .toLowerCase();

    // 3. Search loop: iterate through up to 5 pages
    for (let gPage = 0; gPage < 5; gPage++) {
      const start = gPage * 10;

      const searchUrl =
        `https://www.google.com/search?q=${encodeURIComponent(keyword)}` +
        `&start=${start}&num=10&hl=en&gl=us`;

      await page.goto(searchUrl, {
        waitUntil: "networkidle",
      });

      let pageResults = [];

      // 4. Retry Google result loading up to 3 times
      for (let retry = 0; retry < 3; retry++) {
        try {
          await page.waitForSelector("h3", {
            timeout: 8000,
          });

          await page.waitForTimeout(1000);

          pageResults = await page.evaluate(() => {
            return Array.from(
              document.querySelectorAll("h3")
            )
              .map((h3) => {
                let a = h3.closest("a");

                if (!a) {
                  let p = h3.parentElement;

                  for (
                    let j = 0;
                    j < 6 && p;
                    j++, p = p.parentElement
                  ) {
                    const sub = p.querySelector("a[href]");

                    if (sub && sub.contains(h3)) {
                      a = sub;
                      break;
                    }
                  }
                }

                if (
                  !a ||
                  !a.href ||
                  !a.href.startsWith("http") ||
                  a.href.includes("google.")
                ) {
                  return null;
                }

                let snippet = "";

                let container = a.parentElement;

                for (
                  let j = 0;
                  j < 6 && container;
                  j++, container = container.parentElement
                ) {
                  const text =
                    container.innerText || "";

                  if (
                    text.length >
                    h3.innerText.length + 50
                  ) {
                    snippet = text
                      .split("\n")
                      .filter(
                        (line) =>
                          line.length > 30 &&
                          !line.includes(h3.innerText)
                      )
                      .slice(0, 2)
                      .join(" ")
                      .trim()
                      .substring(0, 300);

                    if (snippet) {
                      break;
                    }
                  }
                }

                let domain = "";

                try {
                  domain = new URL(a.href)
                    .hostname
                    .replace(/^www\./, "");
                } catch (error) {
                  domain = "";
                }

                return {
                  url: a.href,
                  domain,
                  title: h3.innerText.trim(),
                  snippet,
                };
              })
              .filter(Boolean);
          });

          if (pageResults.length > 0) {
            break;
          }
        } catch (error) {
          if (retry === 2) {
            console.log(
              `Google results failed on page ${gPage + 1}`
            );
          }

          await page.waitForTimeout(1500);

          try {
            await page.reload({
              waitUntil: "networkidle",
            });
          } catch (reloadError) {
            // Continue to next retry
          }
        }
      }

      if (!pageResults.length) {
        break;
      }

      // 5. Result synthesis: update global results and check target
      for (const r of pageResults) {
        r.position = allResults.length + 1;
        allResults.push(r);

        const resultDomain = r.domain.toLowerCase();

        if (
          !found &&
          (
            resultDomain.includes(cleanTarget) ||
            cleanTarget.includes(resultDomain)
          )
        ) {
          found = {
            ...r,
            page: gPage + 1,
          };
        }
      }

      if (found) {
        break;
      }

      await page.waitForTimeout(
        2000 + Math.random() * 2000
      );
    }

    // 6. Finalization: close browser and extract competitors
    await browser.close();
    browser = null;

    const competitors = allResults
      .filter((r) => {
        const resultDomain =
          r.domain.toLowerCase();

        return (
          !resultDomain.includes(cleanTarget) &&
          !cleanTarget.includes(resultDomain)
        );
      })
      .slice(0, 10);

    return {
      success: true,
      data: {
        keyword,
        targetDomain,
        position: found?.position || null,
        page: found?.page || null,
        title: found?.title || "",
        snippet: found?.snippet || "",
        competitors,
        totalResultsScanned: allResults.length,
      },
    };
  } catch (error) {
    console.error(
      "Rank check error:",
      error.message
    );

    if (browser) {
      await browser.close().catch(() => {});
    }

    return {
      success: false,
      error: error.message,
    };
  }
}