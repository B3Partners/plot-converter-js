export type EntityType = 'Lne' | 'Arc' | 'Prt' | 'Img' | 'PAr' | 'PLn' | 'Rct' | 'Spl' | 'STx' | 'Syn';

export interface Point {
    x: number;
    y: number;
}

export interface FillType {
    color?: string;
    paint?: { mode: boolean; color1: number; name: string };
}

export interface LineType {
    name: 'Solid';
}

export interface Transform {
    m00: number;
    m10: number;
    m01: number;
    m11: number;
}

export interface ActionLayerEntity {
    id: string;
    zLevel: number;
    attributes: any[];
}

export interface LineEntity extends ActionLayerEntity {
    point1: Point;
    point2: Point;
    color: string;
    lineType: LineType;
    lineWidth: number;
    alpha: number;
}

export interface ArcEntity extends ActionLayerEntity {
    point1: Point;
    point2: Point;
    start: number;
    extent: number;
    color: string;
    fillType: FillType;
    lineType: LineType;
    lineWidth: number;
}

export interface PolyLineEntity extends ActionLayerEntity {
    typeList: string;
    color: string;
    lineType: LineType;
    lineWidth: number;
    alpha: number;
    drawOutline: boolean;
    pointList: Point[];
    fillType: FillType;
}

export interface RectangleEntity extends ActionLayerEntity {
    point1: Point;
    point2: Point;
    transform: Transform;
    color: string;
    fillType: FillType;
    lineType: LineType;
    lineWidth: number;
    alpha: number;
}

export interface SymbolEntity extends ActionLayerEntity {
    symbol: {
        transform: Transform;
        symbolId: string;
        alpha: number;
    },
    text: {
        text: string;
        textOrigin: Point;
        origin: Point;
        textAngle: number;
        style: {}
    }
}

export interface PartEntity extends ActionLayerEntity {
    children: string[];
    layerInvisible: boolean;
    pixelScale: boolean;
    origin: Point;
    name?: string;
}

export interface ActionLayerEntityBase {
    entityIdentifier: EntityType;
    entity: ActionLayerEntity;
}

export interface ActionLayerEntities {
    version: number;
    topEntityIds: string[];
    entityList: ActionLayerEntityBase[];
}
