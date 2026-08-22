import { rankTracker } from "./rankTrackerService.js";

export async function keywordTracking(tracking) {
  try {
    let result = null;

    // Try the ranking check up to 2 times
    for (let attempt = 1; attempt <= 2; attempt++) {
      result = await rankTracker(
        tracking.keyword,
        tracking.domain
      );

      if (
        result?.success &&
        result?.data &&
        result.data.totalResultsScanned > 0
      ) {
        break;
      }

      if (attempt < 2) {
        await new Promise((resolve) =>
          setTimeout(
            resolve,
            result?.success ? 3000 : 5000
          )
        );
      }
    }

    // Update tracking when ranking check succeeds
    if (result?.success && result?.data) {
      const previousPosition =
        tracking.currentPosition;

      const today = new Date();

      today.setHours(0, 0, 0, 0);

      tracking.currentPosition =
        result.data.position;

      tracking.currentPage =
        result.data.page;

      tracking.competitors =
        result.data.competitors || [];

      tracking.lastChecked =
        new Date();

      tracking.status =
        "complete";

      // Calculate position change
      tracking.positionChange =
        previousPosition && result.data.position
          ? previousPosition - result.data.position
          : 0;

      // Update best position
      if (
        result.data.position &&
        (
          !tracking.bestPosition ||
          result.data.position <
            tracking.bestPosition
        )
      ) {
        tracking.bestPosition =
          result.data.position;
      }

      // Create history entry
      const historyEntry = {
        date: today,
        position: result.data.position,
        page: result.data.page,
        title: result.data.title || "",
        snippet: result.data.snippet || "",
      };

      // Check today's history
      const historyIndex =
        tracking.rankHistory.findIndex(
          (history) =>
            new Date(history.date).toDateString() ===
            today.toDateString()
        );

      // Update or add today's history
      if (historyIndex >= 0) {
        tracking.rankHistory[historyIndex] =
          historyEntry;
      } else {
        tracking.rankHistory.push(
          historyEntry
        );
      }
    } else {
      tracking.status = "failed";
    }

    await tracking.save();

    return result;
  } catch (error) {
    console.error(
      "Keyword tracking error:",
      error.message
    );

    tracking.status = "failed";

    await tracking.save();

    return {
      success: false,
      message: error.message,
    };
  }
}