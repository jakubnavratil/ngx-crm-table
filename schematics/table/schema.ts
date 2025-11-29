export interface Schema {
  // The name of the service.
  name: string;

  // The path to create the service.
  api: string;

  // The name of the project.
  gqlprefix: string;

  // properties(comma separated) to fetch, show and edit
  props?: string;
}
