'use strict'

// `@vue/content-mapper` codegen plugin: the TypeScript 7.1 counterpart of the
// `vue-router/volar/sfc-typed-router` Volar plugin. In `<script setup>`, `useRoute()` and
// `typeof useRoute` take the names of the routes of the file, and so does `$route` in the template.
// The route names come from the generated `vue-router/auto-routes` types, which TypeScript resolves
// and watches, so this stays a pure function of the file and the plugin options.

const { relative } = require('node:path')

/** @param {{ ts: any, fileName: string, ir: any }} file @param {{ config: { options?: { rootDir?: string } } }} ctx */
exports.codegen = ({ ts, fileName, ir }, { config }) => {
  const rootDir = config.options?.rootDir
  const filePath = (rootDir ? relative(rootDir, fileName) : fileName).replace(/\\/g, '/')
  const routeNames = `<import('vue-router/auto-routes')._RouteNamesForFilePath<${JSON.stringify(filePath)}>>`
  const routeType = `ReturnType<typeof import('vue-router').useRoute${routeNames}>`

  return {
    rewrite ({ scriptSetup }) {
      const block = ir.scriptSetup
      if (!block || !scriptSetup) { return }
      const isJs = block.lang.startsWith('js')

      block.ast.forEachChild(function visit (node) {
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'useRoute' && !node.typeArguments && !node.arguments.length) {
          if (isJs) {
            // JavaScript components are checked as JavaScript, so the type goes in a JSDoc cast
            scriptSetup.insertBefore(node.getStart(block.ast), `/** @type {${routeType}} */ (`)
            scriptSetup.insertAfter(node.end, ')')
          } else {
            scriptSetup.insertAfter(node.expression.end, routeNames)
          }
        } else if (!isJs && ts.isTypeQueryNode(node) && ts.isIdentifier(node.exprName) && node.exprName.text === 'useRoute' && !node.typeArguments) {
          scriptSetup.insertAfter(node.exprName.end, routeNames)
        } else {
          node.forEachChild(visit)
        }
      })
    },
    templateContext: () => [`{ $route: ${routeType} }`],
  }
}
