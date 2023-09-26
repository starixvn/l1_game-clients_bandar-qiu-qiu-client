import { Label, Node, Vec3, _decorator, sp, tween, WebView ,UITransform, Component, PolygonCollider2D, v3, Vec2, Intersection2D } from "cc";
const { ccclass, property } = _decorator;

@ccclass
export default class DraggableItem extends Component {
    @property({ type: PolygonCollider2D })
    colliders: PolygonCollider2D[] = [];

    @property(Node)
    targetNode: Node = null;

    get target(): Node {
        return this.targetNode ?? this.node;
    }

    private startPosition = v3(0, 0);
    private startTouchLocation = v3(0, 0);

    private isTouchStarted = false;

    public touchCallback = {
        start: (node: Node) => {},
        move: (touchPosition: Vec2) => {},
        end: (isClicked: boolean) => {}
    };

    checkCollider(event): boolean {
        if (this.colliders.length === 0) {
            return true;
        }

        const touchLocation = event.touch.getLocation();
        return this.colliders.some((collider) => Intersection2D.pointInPolygon(touchLocation, collider.points));
    }

    onLoad() {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    onDestroy() {
        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    onTouchStart(e) {
        if (!this.checkCollider(e)) {
            console.log("not touch in collider");
            return;
        }
        this.isTouchStarted = true;
        this.touchCallback.start(this.node);
        this.startPosition = this.target.position;
        this.startTouchLocation = e.touch.getLocation();
    }

    onTouchMove(e) {
        if (!this.isTouchStarted) {
            return;
        }
        this.target.position = e.touch.getLocation().sub(this.startTouchLocation).add(this.startPosition);
        this.touchCallback.move(e.touch.getLocation());
    }

    onTouchEnd(e) {
        if (!this.isTouchStarted) {
            return;
        }
        this.isTouchStarted = false;
        this.touchCallback.end(e && this.isClicked(e));
    }

    isClicked(e): boolean {
        const delta = e.touch.getLocation().sub(this.startTouchLocation);
        return Math.abs(delta.x) + Math.abs(delta.y) < 10;
    }

    onTouchCancel(e) {
        if (!this.isTouchStarted) {
            return;
        }
        this.isTouchStarted = false;
        this.touchCallback.end(false);
    }
}
