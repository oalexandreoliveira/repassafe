-- The workflow function has a local variable named requires_approval and reads
-- the column with the same name. Qualify the stored column reference without
-- duplicating the complete state machine in a second migration.
do $$
declare
  previous_definition text;
  corrected_definition text;
begin
  select pg_get_functiondef('private.process_workflow_command()'::regprocedure)
  into previous_definition;

  corrected_definition := replace(
    previous_definition,
    'select requires_approval into requires_approval',
    'select groups.requires_approval into requires_approval'
  );

  if corrected_definition = previous_definition then
    raise exception 'Expected workflow approval lookup was not found';
  end if;

  execute corrected_definition;
end;
$$;
