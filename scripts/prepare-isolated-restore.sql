\set ON_ERROR_STOP on

drop schema if exists public cascade;
drop schema if exists private cascade;

create schema public authorization postgres;
comment on schema public is 'standard public schema';
