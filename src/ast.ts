const recast = require("recast");
const n = recast.types.namedTypes;
const b = recast.types.builders;

function isStringTree(value: any /* Expression | Pattern */): boolean {
  return n.Literal.check(value) || n.BinaryExpression.check(value) || n.TemplateElement.check(value);
}
/**
 * Resolves a string expression from an AST property value.
 * Supports Literal, BinaryExpression and TemplateLiteral instructions.
 * BinaryExpression and TemplateLiteral are supported if their internal instructions are Literal only.
 * @param value
 * @returns string
 */
function resolveStringValue(value: any /* Expression | Pattern */): string {
  if (n.Literal.check(value)) {
    return value.value;
  } else if (n.BinaryExpression.check(value) && value.operator === '+') {
    return resolveStringValue(value.left) + resolveStringValue(value.right);
  } else if (n.TemplateElement.check(value)) {
    return value.value.cooked;
  } else if (n.TemplateLiteral.check(value)) {
    const vals = [], len = value.expressions.length;
    let i = 0;

    for (i; i<len; i++) {
      vals.push(resolveStringValue(value.quasis[i]));
      vals.push(resolveStringValue(value.expressions[i]));
    }
    vals.push(resolveStringValue(value.quasis[i]));

    return vals.join('');
  }
  else {
    throw new Error(`Can't resolve static string. Type ${value.type} is not allowed.`);
  }
}

export interface RouteModuleTransformerController {
  transformers: Array<{
    expLiteral: string,
    transform: (fnCode: string | any) => string
  }>,
  getCode: (pretty: boolean) => string
}

export function createTransformerController(source: string): RouteModuleTransformerController {
  const ast = recast.parse(source, { ecmaVersion: 5, sourceType: 'module'});

  const routeModuleTransformer: RouteModuleTransformerController = {
    transformers: [],
    getCode(pretty: boolean): string {
      if (pretty) {
        return recast.prettyPrint(ast).code
      } else {
        return recast.print(ast).code
      }
    }
  };

  recast.visit(ast, {
    visitProperty: function(path) {
      if (n.Identifier.check(path.value.key) && path.value.key.name === 'loadChildren' && isStringTree(path.value.value) ) {
        routeModuleTransformer.transformers.push({
          expLiteral: resolveStringValue(path.value.value),
          transform(fnCode: string | any /* FunctionDeclaration */): string {

            const fnDec = typeof fnCode === 'string' ?
              recast.parse(fnCode, { ecmaVersion: 5, sourceType: 'script'}).program.body[0]
              : fnCode
            ;

            n.FunctionDeclaration.assert(fnDec);

            path.value.value = b.functionExpression(
              null, // Anonymize the function expression.
              fnDec.params,
              fnDec.body
            );

            return recast.print(path.value.value).code;
          }
        })
      }
      this.traverse(path);
    }
  });

  return routeModuleTransformer;
}