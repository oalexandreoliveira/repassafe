-- Grupos de colegas: o gestor é um papel de vínculo distinto do aprovador
-- institucional. Fica em migração própria porque um valor novo de enum só
-- pode ser usado depois que a transação que o criou é confirmada.
alter type public.group_role add value if not exists 'manager';

create type public.group_kind as enum ('institutional', 'peer');
