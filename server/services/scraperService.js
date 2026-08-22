import puppeteer from "puppeteer";

export async function scrapeUrl(url) {
    let browser;

    const startTime = Date.now();

    try {
        // =====================================================
        // 1. VALIDATE URL
        // =====================================================

        if (!url || typeof url !== "string") {
            throw new Error("URL is required");
        }

        const cleanUrl = url.trim();

        let parsedUrl;

        try {
            parsedUrl = new URL(cleanUrl);
        } catch {
            throw new Error("Invalid URL");
        }

        if (
            parsedUrl.protocol !== "http:" &&
            parsedUrl.protocol !== "https:"
        ) {
            throw new Error(
                "Only HTTP and HTTPS URLs are supported"
            );
        }

        console.log("========================================");
        console.log("Starting SEO page scrape");
        console.log("URL:", cleanUrl);
        console.log("========================================");

        // =====================================================
        // 2. LAUNCH BROWSER
        // =====================================================

        browser = await puppeteer.launch({
            headless: true,

            args: [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
            ],
        });

        // =====================================================
        // 3. CREATE PAGE
        // =====================================================

        const page = await browser.newPage();

        // Desktop browser size
        await page.setViewport({
            width: 1366,
            height: 768,
            deviceScaleFactor: 1,
        });

        // =====================================================
        // 4. SET USER AGENT
        // =====================================================

        await page.setUserAgent(
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36"
        );

        // =====================================================
        // 5. SET TIMEOUTS
        // =====================================================

        page.setDefaultNavigationTimeout(30000);
        page.setDefaultTimeout(30000);

        // =====================================================
        // 6. CAPTURE RESPONSE
        // =====================================================

        let mainResponse = null;

        page.on("response", (response) => {
            const responseUrl = response.url();

            if (
                responseUrl === cleanUrl ||
                responseUrl === page.url()
            ) {
                mainResponse = response;
            }
        });

        // =====================================================
        // 7. LOAD PAGE
        // =====================================================

        const response = await page.goto(cleanUrl, {
            waitUntil: "networkidle2",
            timeout: 30000,
        });

        // =====================================================
        // 8. WAIT A LITTLE FOR JS CONTENT
        // =====================================================

        await new Promise((resolve) =>
            setTimeout(resolve, 1000)
        );

        // =====================================================
        // 9. GET BASIC PAGE INFORMATION
        // =====================================================

        const status =
            response?.status() ||
            mainResponse?.status() ||
            null;

        const finalUrl = page.url();

        const loadTime = Date.now() - startTime;

        // =====================================================
        // 10. GET HTML
        // =====================================================

        const html = await page.content();

        const pageSize = Buffer.byteLength(
            html,
            "utf8"
        );

        // =====================================================
        // 11. ANALYZE PAGE DOM
        // =====================================================

        const scrapedData = await page.evaluate(() => {
            // -------------------------------------------------
            // Helper: get meta content
            // -------------------------------------------------

            const getMeta = (name) => {
                const element =
                    document.querySelector(
                        `meta[name="${name}"]`
                    );

                return (
                    element?.getAttribute("content") ||
                    ""
                ).trim();
            };

            // -------------------------------------------------
            // Helper: get property meta
            // -------------------------------------------------

            const getProperty = (property) => {
                const element =
                    document.querySelector(
                        `meta[property="${property}"]`
                    );

                return (
                    element?.getAttribute("content") ||
                    ""
                ).trim();
            };

            // =================================================
            // METADATA
            // =================================================

            const title =
                document.title?.trim() || "";

            const description =
                getMeta("description");

            const canonicalElement =
                document.querySelector(
                    'link[rel="canonical"]'
                );

            const canonical =
                canonicalElement
                    ?.getAttribute("href")
                    ?.trim() || "";

            const robots =
                getMeta("robots");

            // IMPORTANT:
            // ogTitle = og:title
            // ogDescription = og:description

            const ogTitle =
                getProperty("og:title");

            const ogDescription =
                getProperty("og:description");

            const ogImage =
                getProperty("og:image");

            const twitterCard =
                getMeta("twitter:card");

            const viewport =
                getMeta("viewport");

            // -------------------------------------------------
            // Charset
            // -------------------------------------------------

            const charsetElement =
                document.querySelector(
                    "meta[charset]"
                );

            const charset =
                charsetElement
                    ?.getAttribute("charset")
                    ?.trim() || "";

            // =================================================
            // HEADINGS
            // =================================================

            const getHeadings = (tag) => {
                return Array.from(
                    document.querySelectorAll(tag)
                )
                    .map((element) =>
                        element.textContent
                            ?.replace(/\s+/g, " ")
                            .trim()
                    )
                    .filter(Boolean);
            };

            const headings = {
                h1: getHeadings("h1"),
                h2: getHeadings("h2"),
                h3: getHeadings("h3"),
                h4: getHeadings("h4"),
                h5: getHeadings("h5"),
            };

            // =================================================
            // BODY TEXT
            // =================================================

            const bodyText =
                document.body?.innerText || "";

            const cleanedText =
                bodyText
                    .replace(/\s+/g, " ")
                    .trim();

            const words = cleanedText
                .split(/\s+/)
                .filter(Boolean);

            const wordCount = words.length;

            // =================================================
            // KEYWORD COUNT
            // =================================================

            const wordFrequency = {};

            words.forEach((word) => {
                const cleanWord = word
                    .toLowerCase()
                    .replace(/[^\p{L}\p{N}-]/gu, "");

                if (
                    cleanWord.length >= 3 &&
                    cleanWord.length <= 30
                ) {
                    wordFrequency[cleanWord] =
                        (wordFrequency[cleanWord] || 0) + 1;
                }
            });

            const keywords = Object.entries(
                wordFrequency
            )
                .sort((a, b) => b[1] - a[1])
                .slice(0, 20)
                .map(([keyword, count]) => ({
                    keyword,
                    count,
                    density:
                        wordCount > 0
                            ? Number(
                                  (
                                      (count /
                                          wordCount) *
                                      100
                                  ).toFixed(2)
                              )
                            : 0,
                }));

            // =================================================
            // LINKS
            // =================================================

            const currentHostname =
                window.location.hostname
                    .replace(/^www\./, "")
                    .toLowerCase();

            const linkElements =
                Array.from(
                    document.querySelectorAll("a[href]")
                );

            let internalLinks = 0;
            let externalLinks = 0;

            const links = [];

            linkElements.forEach((element) => {
                const href =
                    element.href?.trim() || "";

                if (!href) {
                    return;
                }

                let linkUrl;

                try {
                    linkUrl = new URL(
                        href,
                        window.location.href
                    );
                } catch {
                    return;
                }

                const hostname =
                    linkUrl.hostname
                        .replace(/^www\./, "")
                        .toLowerCase();

                if (
                    hostname === currentHostname
                ) {
                    internalLinks++;
                } else {
                    externalLinks++;
                }

                links.push({
                    url: linkUrl.href,
                    text:
                        element.textContent
                            ?.replace(/\s+/g, " ")
                            .trim() || "",
                    internal:
                        hostname ===
                        currentHostname,
                });
            });

            // =================================================
            // IMAGES
            // =================================================

            const imageElements =
                Array.from(
                    document.querySelectorAll("img")
                );

            let imagesWithAlt = 0;
            let imagesMissingAlt = 0;

            const images = imageElements.map(
                (image) => {
                    const alt =
                        image.getAttribute("alt");

                    const hasAlt =
                        alt !== null &&
                        alt.trim().length > 0;

                    if (hasAlt) {
                        imagesWithAlt++;
                    } else {
                        imagesMissingAlt++;
                    }

                    return {
                        src:
                            image.src || "",
                        alt:
                            alt || "",
                        hasAlt,
                    };
                }
            );

            // =================================================
            // SCHEMA / STRUCTURED DATA
            // =================================================

            const schemaScripts =
                Array.from(
                    document.querySelectorAll(
                        'script[type="application/ld+json"]'
                    )
                );

            const schemas = [];

            const schemaIssues = [];

            schemaScripts.forEach((script) => {
                const content =
                    script.textContent?.trim() || "";

                if (!content) {
                    return;
                }

                try {
                    const parsed =
                        JSON.parse(content);

                    schemas.push(parsed);
                } catch {
                    schemaIssues.push({
                        severity: "high",
                        category:
                            "Structured Data",
                        message:
                            "Invalid JSON-LD structured data found.",
                        recommendation:
                            "Fix the JSON-LD syntax so search engines can parse the structured data.",
                    });
                }
            });

            // =================================================
            // RETURN DATA
            // =================================================

            return {
                metadata: {
                    title: {
                        value: title,
                        length: title.length,
                    },

                    description: {
                        value: description,
                        length:
                            description.length,
                    },

                    canonical,

                    robots,

                    ogTitle,

                    ogDescription,

                    ogImage,

                    twitterCard,

                    viewport,

                    charset,
                },

                headings,

                text: {
                    wordCount,
                    keywords,
                },

                links: {
                    total: links.length,
                    internal: internalLinks,
                    external: externalLinks,
                    broken: 0,
                    data: links,
                },

                images: {
                    total: images.length,
                    withAlt: imagesWithAlt,
                    missingAlt:
                        imagesMissingAlt,
                    data: images,
                },

                schema: {
                    count: schemas.length,
                    data: schemas,
                },

                schemaIssues,
            };
        });

        // =====================================================
        // 12. CLOSE BROWSER
        // =====================================================

        await browser.close();

        browser = null;

        // =====================================================
        // 13. FINAL RESULT
        // =====================================================

        console.log("========================================");
        console.log("Scraping completed");
        console.log("Status:", status);
        console.log("Final URL:", finalUrl);
        console.log("Load time:", `${loadTime} ms`);
        console.log("Page size:", `${pageSize} bytes`);
        console.log(
            "Word count:",
            scrapedData.text.wordCount
        );
        console.log(
            "Images:",
            scrapedData.images.total
        );
        console.log(
            "Links:",
            scrapedData.links.total
        );
        console.log("========================================");

        return {
            success: true,

            data: {
                url: cleanUrl,

                finalUrl,

                html,

                status,

                loadTime,

                pageSize,

                ...scrapedData,
            },
        };
    } catch (error) {
        // =====================================================
        // 14. CLOSE BROWSER IF ERROR
        // =====================================================

        if (browser) {
            try {
                await browser.close();
            } catch {
                // Ignore browser close error
            }
        }

        // =====================================================
        // 15. ERROR MESSAGE
        // =====================================================

        let errorMessage =
            "Failed to scrape webpage";

        if (
            error.name ===
            "TimeoutError"
        ) {
            errorMessage =
                "Page took too long to load";
        } else if (
            error.message
        ) {
            errorMessage =
                error.message;
        }

        console.error(
            "Scraper error:",
            errorMessage
        );

        return {
            success: false,

            error: errorMessage,
        };
    }
}