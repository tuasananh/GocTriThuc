/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { TextMatchTransformer } from '@lexical/markdown';
import { $createEquationNode, $isEquationNode, EquationNode } from '../../nodes/EquationNode';

export const EQUATION: TextMatchTransformer = {
    dependencies: [EquationNode],
    export: (node) => {
        if (!$isEquationNode(node)) {
            return null;
        }
        const equation = node.getEquation();
        const inline = node.isInline();
        return (inline ? '$' : '$$') + equation + (inline ? '$' : '$$');
    },
    importRegExp: /\$+(.*?)\$+/,
    regExp: /(\${1,2})(.*?)(\${1,2})/,
    replace: (textNode, match) => {
        const [, startDollars, equation] = match;
        // If it's $$...$$ it's block, if $...$ it's inline
        const isInline = startDollars.length === 1;
        const equationNode = $createEquationNode(equation, isInline);
        textNode.replace(equationNode);
    },
    trigger: ' ',
    type: 'text-match',
};
