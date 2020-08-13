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

export function coordsList(points: Point[] | any): string {
    return points.map((p: any) => {
        if (Array.isArray(p)) {
            return p[0] + ' ' + p[1];
        } else {
            return p.x + ' ' + p.y;
        }
    }).join(',');
}

export function geoJsonCoordinatesToCoordsList(feature: { geometry: { coordinates: number[][] } }): string {
    const rdPoints = pointsToRD(feature.geometry.coordinates.map(coordinateToPoint));
    return coordsList(rdPoints);
}

export function toHexColor(color: number) {
    const s = (color & 0xffffff).toString(16);
    return '#' + '0'.repeat(6 - s.length) + s;
}

export function toStrokeWidth(width: number) {
    return Math.max(1, width * 1.5)
}