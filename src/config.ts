export const SITE = {
  website: "https://bprp.xyz/", // replace this with your deployed domain
  author: "Ben Packer",
  profile: "https://bprp.xyz/",
  desc: "A Brooklyn based software engineer and socialist passionate about the upcoming PostgreSQL release and surviving the 21st century.",
  title: "bprp.xyz",
  ogImage: "og-image.png",
  lightAndDarkMode: true,
  postPerIndex: 4,
  postPerPage: 4,
  scheduledPostMargin: 15 * 60 * 1000, // 15 minutes
  showArchives: true,
  showBackButton: true, // show back button in post detail
  editPost: {
    enabled: false,
    text: "Suggest Changes",
    url: "https://github.com/satnaing/astro-paper/edit/main/",
  },
  dynamicOgImage: true,
  lang: "en", // html lang code. Set this empty and default will be "en"
  timezone: "Asia/Bangkok", // Default global timezone (IANA format) https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
} as const;
