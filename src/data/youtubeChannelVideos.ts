/**
 * Videos from AKM Care YouTube channel (synced from channel RSS).
 * Channel: https://www.youtube.com/channel/UCZMpbBwhsEBgeeO32V_MaaQ (@akmcare1309)
 * Refresh: fetch https://www.youtube.com/feeds/videos.xml?channel_id=UCZMpbBwhsEBgeeO32V_MaaQ
 */

export const YOUTUBE_CHANNEL_ID = "UCZMpbBwhsEBgeeO32V_MaaQ";
export const YOUTUBE_CHANNEL_URL = "https://www.youtube.com/channel/UCZMpbBwhsEBgeeO32V_MaaQ";
export const YOUTUBE_CHANNEL_HANDLE_URL = "https://www.youtube.com/@akmcare1309";

export type ChannelVideoCategory = "Training" | "Motivation" | "Industry" | "Spirituality";

export type ChannelVideo = {
  id: string;
  videoId: string;
  title: string;
  published: string;
  category: ChannelVideoCategory;
};

function formatPublished(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

/** All current uploads from the channel (newest first). */
const RAW: Omit<ChannelVideo, "id">[] = [
  {
    videoId: "cdY38GAnG5U",
    title: "Gyanvatsal Swamiji — spirituality, ethics, unity, patriotism, discipline & determination",
    published: "2024-06-23T10:27:49+00:00",
    category: "Spirituality",
  },
  {
    videoId: "2HkdFy2RziI",
    title: "Essentials inside a leader — courage & soldiers' mindset",
    published: "2023-04-12T13:44:21+00:00",
    category: "Motivation",
  },
  {
    videoId: "dRwpe7VW_Z0",
    title: "Courage, patience & presence of mind in tough times",
    published: "2023-02-28T17:07:11+00:00",
    category: "Motivation",
  },
  {
    videoId: "biKmVwdEZck",
    title: "Our Indian soldiers — respect & gratitude",
    published: "2023-01-26T16:09:44+00:00",
    category: "Motivation",
  },
  {
    videoId: "5dOz3VlOqSM",
    title: "Importance of simplicity",
    published: "2023-01-10T14:15:58+00:00",
    category: "Motivation",
  },
  {
    videoId: "vmboyU5x-z8",
    title: "The reality of real success",
    published: "2022-11-28T12:47:36+00:00",
    category: "Motivation",
  },
  {
    videoId: "LQWLbTT4YBE",
    title: "Positive approach & mindset",
    published: "2022-08-11T12:34:38+00:00",
    category: "Motivation",
  },
  {
    videoId: "cPtBKDp4Qhw",
    title: "Budget — annual financial awareness",
    published: "2022-02-17T17:36:32+00:00",
    category: "Industry",
  },
  {
    videoId: "B0jGp2byXuc",
    title: "True patriotism & our soldiers",
    published: "2022-02-05T17:58:33+00:00",
    category: "Motivation",
  },
  {
    videoId: "TzTnFHdAqmk",
    title: "New Year wishes & wellbeing",
    published: "2022-01-01T11:51:16+00:00",
    category: "Industry",
  },
  {
    videoId: "7ZMkdj_Zl7Q",
    title: "Importance of mentors & parents in life",
    published: "2021-12-27T15:00:26+00:00",
    category: "Training",
  },
  {
    videoId: "gGW2FR_KV7o",
    title: "Spirituality — devotion & holiness",
    published: "2021-12-05T18:09:34+00:00",
    category: "Spirituality",
  },
  {
    videoId: "XiW-2mmO_kk",
    title: "Happy Children's Day",
    published: "2021-11-14T18:46:46+00:00",
    category: "Motivation",
  },
  {
    videoId: "I6rIeHUroZ8",
    title: "Being human in a true sense",
    published: "2021-10-16T10:04:46+00:00",
    category: "Motivation",
  },
  {
    videoId: "ny2U8J31rgA",
    title: "World Nature Day — climate & environment",
    published: "2021-10-03T20:53:46+00:00",
    category: "Industry",
  },
];

export const CHANNEL_VIDEOS: ChannelVideo[] = RAW.map((v, i) => ({
  ...v,
  id: String(i + 1),
}));

export function getChannelVideosForDisplay() {
  return CHANNEL_VIDEOS.map((v) => ({
    ...v,
    dateLabel: formatPublished(v.published),
  }));
}
