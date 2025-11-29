import {
  basename,
  dirname,
  join,
  normalize,
  Path,
  strings,
} from '@angular-devkit/core';
import {
  apply,
  applyTemplates,
  chain,
  mergeWith,
  move,
  Rule,
  SchematicContext,
  Tree,
  url,
} from '@angular-devkit/schematics';
import * as pluralize from 'pluralize';
import { Schema } from './schema';

// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export function client(_options: Schema): Rule {
  return (_tree: Tree, _context: SchematicContext) => {
    const nameWithoutPath: string = basename(_options.name as Path);
    const namePath: string = dirname(_options.name as Path);
    const normalizedPath = normalize('/'.concat(namePath));

    const path = join(
      strings.dasherize(normalizedPath) as Path,
      strings.dasherize(nameWithoutPath),
    );

    const name = pluralize.singular(nameWithoutPath);
    const api = pluralize.singular(_options.api);
    const apiPlural = _options.api;

    const propsText = _options.props ? _options.props : null;
    const props = propsText?.split(',') ?? [];

    const sourceTemplates = url('./files');
    const sourceParametrizedTemplates = apply(sourceTemplates, [
      applyTemplates({
        ..._options,
        name: name,
        plural: nameWithoutPath,
        props,

        ...strings,
        api,
        apiPlural,
        apiMethod: (str: string) => str[0].toLowerCase() + str.substr(1),
        gqlObject: (str: string) => _options.gqlprefix + str,
      }),
      move(path),
    ]);

    return chain([mergeWith(sourceParametrizedTemplates)]);
  };
}
