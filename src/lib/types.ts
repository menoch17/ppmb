export type Channel = {
  nodeid: number;
  parentid: number;
  title: string;
  description: string | null;
  urlident: string | null;
  displayorder: number;
};

export type Thread = {
  nodeid: number;
  channel_id: number;
  userid: number | null;
  authorname: string | null;
  title: string;
  description: string | null;
  urlident: string | null;
  publishdate: number | null;
  lastcontent: number | null;
  lastcontentid: number | null;
  lastcontentauthor: string | null;
  textcount: number;
  totalcount: number;
  sticky: boolean;
  open: boolean;
};

export type Post = {
  nodeid: number;
  thread_id: number;
  parentid: number;
  userid: number | null;
  authorname: string | null;
  publishdate: number | null;
  title: string | null;
  rawtext: string | null;
  htmlstate: string | null;
  is_starter: boolean;
};

export type SearchResult = Pick<
  Thread,
  "nodeid" | "channel_id" | "title" | "authorname" | "publishdate" | "lastcontent"
> & {
  channel_title: string;
};
