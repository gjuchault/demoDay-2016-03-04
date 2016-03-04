/// <reference path='d3.d.ts' />

class Graph {
    private r: number = 30;

    private nodes = [];
    private links = [];

    private $el: Element;
    private w: number;
    private h: number;

    private vis  : d3.Selection<any>;
    private force: d3.layout.Force<any, any>;

    constructor (selector : string) {
        this.$el = document.querySelector(selector);
        this.w = this.$el.getBoundingClientRect().width;
        this.h = this.$el.getBoundingClientRect().height;

        this.vis = d3
            .select(this.$el)
            .append('svg:svg')
            .attr('width', this.w)
            .attr('height', this.h);

        this.force = d3.layout.force()
            .size([this.w, this.h])
            .gravity(.05)
            .linkDistance(120)
            .charge(-300)
            .friction(0.5);

        this.nodes = this.force.nodes();
        this.links = this.force.links();

        // Make it all go
        this.update();
    }

    add (node : any) {
        const source = node.source;
        this.addNode(source);

        if (node.target) {
            const target = node.target;
            this.addNode(target);

            this.addLink(source, target);
        }
    }

    addNode (id : string) {
        if (!this.nodes.some(n => n.id === id)) {
            this.nodes.push({ id: id });
            this.update();
        }
    }

    removeNode (id : string) {
        let i  : number = 0;
        const n: number = this.findNode(id);

        while (i < this.links.length) {
            if (this.links[i].source === n || this.links[i].target === n) {
                this.links.splice(i, 1);
            } else {
                ++i;
            }
        }

        const index = this.findNodeIndex(id);
        if (index > -1) {
            this.nodes.splice(index, 1);
            this.update();
        }
    }

    hasNode (id: string) {
        return g.nodes.some(n => n.id === id);
    }

    addLink (sourceId: string, targetId: string) {
        const sourceNode = this.findNode(sourceId);
        const targetNode = this.findNode(targetId);

        if (sourceNode && targetNode) {
            if (!this.links.some(l => l.source === sourceNode && l.target === targetNode)) {
                this.links.push({
                    source: sourceNode,
                    target: targetNode
                });
                this.update();
            }
        }
    }

    removeLink(sourceId: string, targetId: string) {
        this.links = this.links.filter(l => {
            if (l.source.id === sourceId && l.target.id === targetId) {
                return false;
            }

            return true;
        });
        this.update();
    }

    private findNode (id: string): number {
        for (let node of this.nodes) {
            if (node.id === id) {
                return node;
            }
        }

        return 0;
    }

    private findNodeIndex(id: string): number {
        for (let node of this.nodes) {
            if (node.id === id) {
                return node.index;
            }
        }

        return -1;
    }

    private update () {
        let link: any = this.vis
            .selectAll('line.link')
            .data(this.links, d => `${d.source.id}-${d.target.id}`);

        link.enter()
            .insert('line')
            .attr('class', 'link')
            .on('dblclick', this.removeLinkEvent);

        link.exit().remove();

        let node = this.vis
            .selectAll('g.node')
            .data(this.nodes, d => d.id);

        let nodeEnter = node
            .enter()
            .append('g')
            .attr('class', 'node')
            .call(this.force.drag);

        this.nodes = this.force.nodes();
        nodeEnter
            .append('circle')
            .attr('r', this.r)
            .on('dblclick', this.removeNodeEvent);
        nodeEnter
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '.35em')
            .text(d => d.id);

        node.exit().remove();

        this.force.on('tick', () => {
            link.attr('x1', d => this.calcRealPos(d.source.x, d.source.y, d.target.x, d.target.y, 'x'))
                .attr('y1', d => this.calcRealPos(d.source.x, d.source.y, d.target.x, d.target.y, 'y'))
                .attr('x2', d => this.calcRealPos(d.target.x, d.target.y, d.source.x, d.source.y, 'x'))
                .attr('y2', d => this.calcRealPos(d.target.x, d.target.y, d.source.x, d.source.y, 'y'));

            node.attr('transform', d => `translate(${d.x},${d.y})`);
        });

        // Restart the force layout.
        this.force.start();

        // Run a few times at first to disable aweful animation at start
        for (let i = 10000; i > 0; --i) {
            this.force.tick();
        }
    }

    private calcRealPos(x1: number, y1: number, x2: number, y2: number, what: string) {
        // Move point from the bottom to the edge of the circle. Thales style
        const distance: number = Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));
        const ratio   : number = this.r / distance;
        const deltaX  : number = x2 - x1;
        const deltaY  : number = y2 - y1;

        const wantedX1: number = x1 + (deltaX * ratio);
        const wantedY1: number = y1 + (deltaY * ratio);

        return (what === 'x') ? wantedX1 : wantedY1;
    }

    private removeNodeEvent (d) {
        const source: string = d.id;
        socket.emit('removeUser', source);
    }

    private removeLinkEvent (d) {
        const source: string = d.source.id;
        const target: string = d.target.id;

        socket.emit('removeFriend', { source: source, target: target });
    }
}

const g = new Graph('#graph');
