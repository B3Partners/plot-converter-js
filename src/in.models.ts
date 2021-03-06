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

export interface PolyArrowEntity extends ActionLayerEntity {
    pointList: Point[];
    alpha: number;
    style: {
        name: string;
        color: number;
        lineType: LineType,
        lineWeight: number;
        arrowWidth: number;
        arrowLength: number;
        arrowType: number;
        arrowStart: boolean;
        arrowEnd: boolean;
    };
}

export interface StrokeTextEntity extends ActionLayerEntity {
    text: string;
    textOrigin: Point;
    textAngle: number;
    origin: Point;
    alpha: number;
    style: {
        styleName: string;
        characterColor: string;
        characterLine: number;
        characterSize: number;
        characterSlant: number;
        characterAngle: number;
        relativeWidth: number;
        relativeSpacing: number;
        relativeLineDistance: number;
        monoSpacing: boolean;
        reference: number;
        balloonType: number;
        balloonLineWidth: number;
        balloonColor: string;
        balloonRadius: number;
        includeReferencePointer: boolean;
        balloonFillType: FillType;
        strokeFontName: string;
    }
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
        lowerLeft?: Point;
        upperRight?: Point;
    },
    text: StrokeTextEntity;
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
