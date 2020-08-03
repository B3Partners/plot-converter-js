import {Point} from "./in.models";
import {WGS84ToRD} from "./proj";

export function pointsToRD(points: Point[]): Point[] {
    return points.map(p => WGS84ToRD(p.y, p.x)).map(coords => ({ x: coords[0], y: coords[1]}));
}

export function coordsList(points: Point[]): string {
    return points.map(p => p.x + ' ' + p.y).join(',');
}