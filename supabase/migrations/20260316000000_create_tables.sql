create table if not exists waitlist (
  id          bigint generated always as identity primary key,
  name        text not null,
  email       text not null,
  q1          text, q2 text, q3 text, q4 text, q5 text,
  q6          text, q7 text, q7b text, q8 text,
  created_at  timestamptz default now()
);

create table if not exists briefs (
  id          bigint generated always as identity primary key,
  child_name  text not null,
  child_age   text not null,
  story_idea  text not null,
  contact     text not null,
  created_at  timestamptz default now()
);
