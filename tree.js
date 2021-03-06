
<template>
  <div class="tableau">
    <div id="container"></div>
  </div>
</template>
<script>
/* eslint-disable */
import G6 from "@antv/g6";
import { data } from "./json";
export default {
  data () {
    return {
      msg: "hello",
      branchData: [],
      isInit: true
    };
  },
  mounted () {
    let _this = this
    // 减号icon
    const COLLAPSE_ICON = function COLLAPSE_ICON (x, y, r) {
      return [
        ["M", x, y],
        ["a", r, r, 0, 1, 0, r * 2, 0],
        ["a", r, r, 0, 1, 0, -r * 2, 0],
        ["M", x + 2, y],
        ["L", x + 2 * r - 2, y]
      ];
    };
    // 加号icon
    const EXPAND_ICON = function EXPAND_ICON (x, y, r) {
      return [
        ["M", x, y],
        ["a", r, r, 0, 1, 0, r * 2, 0],
        ["a", r, r, 0, 1, 0, -r * 2, 0],
        ["M", x + 2, y],
        ["L", x + 2 * r - 2, y],
        ["M", x + r, y - r + 2],
        ["L", x + r, y + r - 2]
      ];
    };
    // 自定义节点名称，需要和defaultNode中的type类型一致
    G6.registerNode(
      "tree-node",
      {
        labelPosition: "center",
        labelAutoRotate: true,
        options: {
          style: {},
          stateStyles: {
            hover: {},
            selected: {}
          }
        },
        // 以下方法只用于自定义节点和边的情形
        draw (cfg, group) {

          let depth = cfg.depth
          let nodeid = cfg.id
          let attrs = {}
          // 对结构层级进行判断 level 为后端提供的参数
          if (cfg.depth === 0) {
            attrs = {
              stroke: '#665ba9'
            }
          }
          else if (cfg.depth === 1) {
            attrs = {
              stroke: '#356bb5'
            }
          }
          else if (cfg.depth === 2) {
            attrs = {
              stroke: '#49c8e8'
            }
          }
          else if (cfg.depth === 3) {
            attrs = {
              stroke: '#70be50'
            }
          }
          else if (cfg.depth === 4) {
            attrs = {
              stroke: '#f6ea46'
            }
          }
          // console.log('draw:', cfg)
          // 边中部显示文字
          graph.edge(() => {
            return {
              label: cfg.uv,
              style: {
                stroke: "blue"
              },
              labelCfg: {
                position: "center",
                // refX: -20,
                // refY: 0,
                style: {
                  fill: "green",
                  stroke: "#f4f7f8",
                  lineWidth: 10
                }
              }
            };
          });

          // 元素的形状、填充色、描边颜色
          attrs.fill = '#fff'
          const rect = group.addShape("rect", {
            attrs: attrs
          });
          // 指标描述 5项指标
          let nameList = [cfg.nameCN, cfg.name, 'visit:' + cfg.visit, 'uv:' + cfg.uv, 'pv:' + cfg.pv]
          let bbox
          for (let i = 0; i < 5; i++) {
            if (cfg.level !== 1) {
              if (i > 1) {
                continue
              }
            }
            // 节点内容超过19的长度后换行
            let content = nameList[i].replace(/(.{19})/g, "$1\n");
            // 节点内文本样式
            let texts = group.addShape("text", {
              attrs: {
                text: content,
                x: 0,
                y: i * 20 + 6,
                textAlign: "left",
                textBaseline: "middle",
                fill: "#666",
              }
            });
            // 使用第一行文字作为起始边界画矩形
            if (i === 0) {
              bbox = texts.getBBox();
            }
            let bboxOther = texts.getBBox();
          }
          // 文本左边padding，节点宽高
          // 是否显示展开和收起icon
          const hasChildren = cfg.children && cfg.children.length > 0;
          if (hasChildren) {
            group.addShape("marker", {
              attrs: {
                x: 150,
                y: cfg.level === 1 ? 50 : 13,
                // 是否有子项目的 icon，icon的位置
                r: 6,
                symbol: EXPAND_ICON,
                stroke: "#666",
                lineWidth: 2
              },
              className: "collapse-icon"
            });
            // 初始化时0层展开icon
            if (_this.isInit) {
              const icon = group.findByClassName("collapse-icon");
              if (cfg.depth === 0 && hasChildren) {
                icon.attr("symbol", COLLAPSE_ICON);
              } else {
                // 新增的展开的节点的状态
                if (hasChildren) {
                  icon.attr("symbol", EXPAND_ICON);
                  cfg.collapsed = true
                } else {
                  icon.attr("symbol", COLLAPSE_ICON);
                  cfg.collapsed = false

                }
              }
            }
          }
          rect.attr({
            x: bbox.minX - 4,
            y: bbox.minY - 6,
            width: 180,
            height: cfg.level === 1 ? 120 : 50,
            lineWidth: 2
          });
          console.log('draw:', cfg);
          // 必须有返回值
          return rect;
        }
      },
      // "single-shape"
      "rect"
    );

    const width = document.getElementById("container").scrollWidth || 800;
    // const width = 1000;
    const height = document.getElementById("container").scrollHeight;

    const graph = new G6.TreeGraph({
      container: "container",
      width,
      height,
      modes: {
        default: [
          {
            type: "collapse-expand",
            onChange (item, collapsed) {
              console.log('onchange:', item);

              _this.isInit = false
              // 点击node节点，展开此节点，收缩其他同级节点及其所有子节点
              // 是否有父节点
              let farNode = item._cfg.parent && item._cfg.parent._cfg.id
              console.log('是否有父节点', farNode);
              let siblingNode
              function collapseNode (children) {
                children.forEach(el => {
                  console.log('el:', children, el, el._cfg.id);
                  // debugger
                  const data = el.get('model');
                  const icon = el.get("group").findByClassName("collapse-icon");
                  if (!icon) return
                  icon.attr("symbol", EXPAND_ICON);
                  let isChildren = el._cfg.children && el._cfg.children.length > 0
                  if (isChildren) {
                    console.log('有子节点', el._cfg.children);
                    // debugger
                    collapseNode(el._cfg.children)
                    // 先关闭子节点后关闭父节点
                    console.log('关闭子节点');
                    data.collapsed = true;
                  }
                })
              }
              // 当前有父节点
              if (farNode) {
                // 获取兄弟节点
                siblingNode = item._cfg.parent._cfg.children
                if (siblingNode.length > 0 && siblingNode) {
                  collapseNode(siblingNode)
                }
              } else {
                // 当前是根节点
                collapseNode(item._cfg.children)
              }
              // let siblingNode = item._cfg.parent._cfg.children
              console.log('该节点的兄弟节点', siblingNode);
              console.log('item:', item);
              console.log('collapsed:', collapsed);



              // 折叠展开节点
              const data = item.get("model");
              const icon = item.get("group").findByClassName("collapse-icon");

              if (collapsed) {
                icon.attr("symbol", EXPAND_ICON);
              } else {
                icon.attr("symbol", COLLAPSE_ICON);
              }
              data.collapsed = collapsed;
              console.log("onchange collapsed:", collapsed);
              console.log("onchange item:", item)
              console.log("onchange data:", data)
              console.log("onchange icon:", icon)
              return true;
            }
          },
          {
            type: 'tooltip',
            formatText: function formatText (data, res) {
              if (data.level === 1) {
                return ''
              }
              return `<div class="tooltip-inner"><div>visit：${data.visit}</div>
              <div>uv：${data.uv}</div>
              <div>pv：${data.pv}</div></div>
              `;
            }
          },
          "drag-canvas",
          "zoom-canvas"
        ]
      },
      defaultNode: {
        type: "tree-node",
        anchorPoints: [
          [0, 0.5],
          [1, 0.5]
        ]
      },
      defaultEdge: {
        // 边的曲线类型
        type: "cubic-horizontal",
        style: {
          stroke: "#A3B1BF"
        }
      },
      // 节点在各状态下的样式
      nodeStateStyles: {
        // hover 状态为 true 时的样式
        hover: {
          fill: "lightsteelblue"
        },
        // click 状态为 true 时的样式
        click: {
          stroke: "red",
          lineWidth: 3
        }
      },
      // 边在各状态下的样式
      edgeStateStyles: {
        // click 状态为 true 时的样式
        click: {
          stroke: "red",
          lineWidth: 3
        }
      },
      layout: {
        type: "compactBox",
        direction: "LR",
        getId (d) {
          return d.id;
        },
        getHeight () {
          return 16;
        },
        getWidth () {
          return 10;
        },
        // 节点之间垂直距离
        getVGap () {
          return 30;
        },
        // 节点之间水平距离
        getHGap () {
          return 150;
        }
      }
    });
    // 事件
    // 监听鼠标点击节点
    graph.on("node:click", e => {
      // 先将所有当前有 click 状态的节点的 click 状态置为 false
      const clickNodes = graph.findAllByState("node", "click");
      clickNodes.forEach(cn => {
        graph.setItemState(cn, "click", false);
      });
      // 找到所有的节点
      let realnode = [];
      let nodeList = graph.getNodes();

      let id = e.item._cfg.id;
      realnode.push(e.item);
      let pid = e.item._cfg.model.pid;
      function deepMap (pid) {
        nodeList.forEach((item, i) => {
          if (item._cfg.id === pid) {
            realnode.push(item);
            if (item._cfg.model.pid) {
              deepMap(item._cfg.model.pid);
            }
          }
        });
      }
      deepMap(pid);
      realnode.forEach(cn => {
        graph.setItemState(cn, "click", true);
      });
      const nodeItem = e.item;
      // 设置目标节点的 click 状态 为 true
      // graph.setItemState(nodeItem, "click", true);
      // 先将所有当前有 click 状态的边的 click 状态置为 false
      {
        const clickEdges = graph.findAllByState("edge", "click");
        clickEdges.forEach(ce => {
          graph.setItemState(ce, "click", false);
        });
        let edgeList = graph.getEdges();
        let realedge = [];
        let ids = e.item._cfg.id;
        let pid = e.item._cfg.model.pid;
        function deepMap (pid) {
          edgeList.forEach((item, i) => {
            // console.log(item)
            // console.log(item._cfg.id)
            let id = item._cfg.id.split(":")[1];
            if (id == pid) {
              realedge.push(item);
              if (item._cfg.id.split(":")[0]) {
                deepMap(item._cfg.id.split(":")[0]);
              }
            }
            if (id == ids) {
              realedge.push(item);
            }
          });
        }
        deepMap(pid);

        realedge.forEach(ce => {
          graph.setItemState(ce, "click", true);
        });
        // graph.setItemState(edgeItem, 'click', true);
      }
    });
    console.log('data:', data)
    // 排序
    function sortNode (childList) {
      // console.log(childList)
      childList.sort((a, b) => b.uv - a.uv)
      childList.forEach(item => {
        if (item.childList) {
          sortNode(item.childList)
        }
      })
    }
    sortNode(data.childList)


    G6.Util.traverseTree(data, function (item) {
      // 折叠所有节点
      item.collapsed = true
      item.id = item.mid;
      item.children = item.childList;
      // console.log(item)
    });

    // 默认展开一层
    data.collapsed = false
    graph.data(data);
    graph.render();
    graph.fitView(50);
  }
};
</script>
<style lang="scss">
.tableau {
  height: 100%;
  #container {
    height: 100%;
    border: 2px solid green;
    .g6-tooltip {
      .tooltip-inner {
        border: 1px solid #e2e2e2;
        border-radius: 4px;
        font-size: 16px;
        color: #545454;
        background-color: rgb(255, 255, 255);
        padding: 10px 28px;
        box-shadow: rgb(174, 174, 174) 0px 0px 10px;
      }
    }
  }
}
</style>

