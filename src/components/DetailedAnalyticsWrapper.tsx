"use client";

import React from "react";
import DetailedAnalytics from "@/pages-old/DetailedAnalytics";

const DetailedAnalyticsWrapper = () => {
  return (
    <div className="px-2 md:px-0">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur shadow rounded-b-none rounded-t-lg px-0 py-0 mb-4">
        {/* We can add filters here if needed */}
      </div>
      <DetailedAnalytics />
    </div>
  );
};

export default DetailedAnalyticsWrapper;