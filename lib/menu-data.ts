export interface MenuItem {
  Name: string;
  Icon: string;
  Path: string;
}

export interface MenuSection {
  Heading: string;
  Menus: MenuItem[];
}

export const menuData: MenuSection[] = [
  {
    Heading: "Content",
    Menus: [
      { Name: "Latest Updates", Icon: "FileText", Path: "/dashboard/latest-updates" },
      { Name: "Photo Gallery", Icon: "Image", Path: "/dashboard/photo-gallery" },
      { Name: "News & Media", Icon: "Newspaper", Path: "/dashboard/news-media" }
    ]
  },
  {
    Heading: "Documents",
    Menus: [
      { Name: "Mandatory Disclosure", Icon: "FileCheck", Path: "/dashboard/mandatory-disclosure" }
    ]
  },
  // {
  //   Heading: "Admissions",
  //   Menus: [
  //     { Name: "Transfer Certificates", Icon: "FileSpreadsheet", Path: "/dashboard/transfer-certificates" }
  //   ]
  // },
  {
    Heading: "People",
    Menus: [
      { Name: "Faculty & Staff", Icon: "Users", Path: "/dashboard/faculty-staff" },
      { Name: "Jobs", Icon: "Briefcase", Path: "/dashboard/jobs" }
    ]
  },
  {
    Heading: "Admin",
    Menus: [
      { Name: "Users & Roles", Icon: "UserCog", Path: "/dashboard/users-roles" }
    ]
  }
];
