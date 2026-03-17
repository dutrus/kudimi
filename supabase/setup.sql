-- Run this in the Supabase SQL Editor

create table if not exists waitlist (
  id          bigint generated always as identity primary key,
  name        text not null,
  email       text not null,
  q1          text,   -- edad del hijo
  q2          text,   -- frecuencia de consumo
  q3          text,   -- contenido inadecuado
  q4          text,   -- qué hizo al respecto (abierta)
  q5          text,   -- creó contenido personalizado
  q6          text,   -- disposición a pagar (escala 1-5)
  q7          text,   -- precio dispuesto a pagar
  q7b         text,   -- razón de no pagar (opcional)
  q8          text,   -- lo más importante en contenido infantil
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
