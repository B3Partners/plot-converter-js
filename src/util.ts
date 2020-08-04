import {Point} from "./in.models";
import {WGS84ToRD} from "./proj";

export function pointToCoordinate(p: Point): number[] {
    return [p.x, p.y];
}

export function coordinateToPoint(c: number[]): Point {
    return {x: c[0], y: c[1]};
}

export function pointsToRD(points: Point[]): Point[] {
    return points.map(p => WGS84ToRD(p.y, p.x)).map(coordinateToPoint);
}

export function coordsList(points: Point[]): string {
    return points.map(p => p.x + ' ' + p.y).join(',');
}