export type EntityType = 'PLn' | 'Syn';

export interface Point {
    x: number;
    y: number;
}

export interface FillType {
    color: string;
}

export interface LineType {
    name: 'Solid';
}

export interface ActionLayerEntity {
    drawOutline: boolean;
    typeList: number;
    pointList: Point[];
    fillType: FillType;
    lineType: LineType;
    lineWidth: number;
    alpha: number;
    styleName: string;
    id: string;
    readOnly: boolean;
    isUser3: boolean;
    isSymbol: boolean;
    zLevel: number;
    attributes: any[];
    versionId: number;
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
