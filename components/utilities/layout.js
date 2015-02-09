/* globals computeLayout */
(function(d3, fc) {
    'use strict';

    fc.utilities.layout = function() {

        // parses the style attribute, converting it into a JavaScript object
        function parseStyle(el) {
            var json = {};
            var style = el.getAttribute('layout-css');
            if (style) {
                style.split(';')
                    .forEach(function(property) {
                        var components = property.split(':');
                        if (components.length === 2) {
                            var name = components[0].trim();
                            var value = components[1].trim();
                            json[name] = isNaN(value) ? value : Number(value);
                        }
                    });
            }
            return json;
        }

        // creates the structure required by the layout engine
        function createNodes(el) {
            function getChildNodes() {
                var children = [];
                for (var i = 0; i < el.childNodes.length; i++) {
                    var child = el.childNodes[i];
                    if (child.nodeType === 1) {
                        if (child.hasAttribute('layout-css')) {
                            children.push(createNodes(child));
                        }
                    }
                }
                return children;
            }
            return {
                style: parseStyle(el),
                children: getChildNodes(el),
                element: el,
                layout: {
                    width: undefined,
                    height: undefined,
                    top: 0,
                    left: 0
                }
            };
        }

        // takes the result of layout and applied it to the SVG elements
        function applyLayout(node) {
            if (node.element.nodeName === 'svg' || node.element.nodeName === 'rect') {
                node.element.setAttribute('width', node.layout.width);
                node.element.setAttribute('height', node.layout.height);
                node.element.setAttribute('x', node.layout.left);
                node.element.setAttribute('y', node.layout.top);
            } else {
                node.element.setAttribute('transform', 'translate(' + node.layout.left + ', ' + node.layout.top + ')');
            }
            node.element.setAttribute('layout-width', node.layout.width);
            node.element.setAttribute('layout-height', node.layout.height);

            node.children.forEach(applyLayout);
        }

        var layout = function(selection, width, height) {

            var measureDimensions = arguments.length === 1;

            selection.each(function(data) {
                if (measureDimensions) {
                    // compute the width and height of the SVG element
                    var style = getComputedStyle(this);
                    width = parseFloat(style.width) - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
                    height = parseFloat(style.height) - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
                }

                // create the layout nodes
                var layoutNodes = createNodes(this);
                // set the width / height of the root
                layoutNodes.style.width = width;
                layoutNodes.style.height = height;

                // use the Facebook CSS goodness
                computeLayout(layoutNodes);

                // apply the resultant layout
                applyLayout(layoutNodes);
            });
        };
        return layout;
    };

}(d3, fc));