import axios from "axios";

export async function rankTracker(keyword, targetDomain) {
    try {
        console.log(
            `Checking keyword "${keyword}" for "${targetDomain}"`
        );

        // =====================================================
        // 1. CHECK SERPER API KEY
        // =====================================================

        if (!process.env.SERPER_API_KEY) {
            throw new Error(
                "SERPER_API_KEY is missing in server/.env"
            );
        }

        // =====================================================
        // 2. CLEAN TARGET DOMAIN
        // =====================================================

        const cleanTarget = targetDomain
            .replace(/^https?:\/\//, "")
            .replace(/^www\./, "")
            .split("/")[0]
            .toLowerCase()
            .trim();

        console.log("Target domain:", cleanTarget);

        // =====================================================
        // 3. SEARCH GOOGLE - UP TO 5 PAGES
        // =====================================================

        const allResults = [];

        for (let page = 1; page <= 5; page++) {
            console.log(
                `Checking Serper Google page ${page}/5`
            );

            const response = await axios.post(
                "https://google.serper.dev/search",
                {
                    q: keyword,
                    gl: "us",
                    hl: "en",
                    num: 10,
                    page: page,
                },
                {
                    headers: {
                        "X-API-KEY":
                            process.env.SERPER_API_KEY,

                        "Content-Type":
                            "application/json",
                    },

                    timeout: 30000,
                }
            );

            const organicResults =
                response.data?.organic || [];

            console.log(
                `Serper page ${page} returned ${organicResults.length} results`
            );

            if (organicResults.length === 0) {
                break;
            }

            for (const result of organicResults) {
                let domain = "";

                try {
                    domain = new URL(result.link)
                        .hostname
                        .replace(/^www\./, "")
                        .toLowerCase();
                } catch {
                    continue;
                }

                allResults.push({
                    position:
                        result.position ||
                        allResults.length + 1,

                    url:
                        result.link || "",

                    domain,

                    title:
                        result.title || "",

                    snippet:
                        result.snippet || "",
                });
            }

            // If target was found, we don't need more pages
            const targetFound = allResults.some(
                (result) => {
                    const resultDomain =
                        result.domain;

                    return (
                        resultDomain ===
                            cleanTarget ||
                        resultDomain.endsWith(
                            `.${cleanTarget}`
                        ) ||
                        cleanTarget.endsWith(
                            `.${resultDomain}`
                        )
                    );
                }
            );

            if (targetFound) {
                console.log(
                    `Target found on Serper page ${page}`
                );

                break;
            }
        }

        // =====================================================
        // 4. FIND TARGET WEBSITE
        // =====================================================

        let found = null;

        for (const result of allResults) {
            const resultDomain =
                result.domain.toLowerCase();

            const targetMatches =
                resultDomain === cleanTarget ||
                resultDomain.endsWith(
                    `.${cleanTarget}`
                ) ||
                cleanTarget.endsWith(
                    `.${resultDomain}`
                );

            if (targetMatches) {
                found = {
                    ...result,

                    page: Math.ceil(
                        result.position / 10
                    ),
                };

                console.log(
                    `TARGET FOUND at position ${result.position}`
                );

                break;
            }
        }

        // =====================================================
        // 5. COMPETITORS
        // =====================================================

        const competitors =
            allResults
                .filter((result) => {
                    const resultDomain =
                        result.domain.toLowerCase();

                    return !(
                        resultDomain ===
                            cleanTarget ||
                        resultDomain.endsWith(
                            `.${cleanTarget}`
                        ) ||
                        cleanTarget.endsWith(
                            `.${resultDomain}`
                        )
                    );
                })
                .slice(0, 10);

        // =====================================================
        // 6. LOG RESULT
        // =====================================================

        console.log(
            `Rank check completed. Results scanned: ${allResults.length}`
        );

        if (found) {
            console.log(
                `Website found at position ${found.position}`
            );
        } else {
            console.log(
                "Website was not found in top 50 results"
            );
        }

        // =====================================================
        // 7. RETURN RESULT
        // =====================================================

        return {
            success: true,

            data: {
                keyword,

                targetDomain,

                position:
                    found?.position || null,

                page:
                    found?.page || null,

                title:
                    found?.title || "",

                snippet:
                    found?.snippet || "",

                competitors,

                totalResultsScanned:
                    allResults.length,
            },
        };
    } catch (error) {
        console.error(
            "Rank check error:",
            error.response?.data ||
                error.message
        );

        return {
            success: false,

            error:
                error.response?.data?.message ||
                error.message ||
                "Rank check failed",
        };
    }
}