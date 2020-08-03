import {
    ActionLayerEntity,
    ActionLayerEntityBase,
    ArcEntity,
    FillType,
    LineEntity, PartEntity,
    PolyLineEntity,
    RectangleEntity, SymbolEntity
} from "./in.models";
import {coordsList, pointsToRD} from "./util";

export type EntityIndex = { [key: string]: ActionLayerEntityBase};

export function convertEntity(entity: ActionLayerEntityBase, entityIndex: EntityIndex, parent?: PartEntity): any {
    switch(entity.entityIdentifier) {
        case 'Lne': return convertLine(entity.entity as LineEntity, parent);
        case 'Arc': return convertArc(entity.entity as ArcEntity, parent);
        case 'PLn': return convertPolyLine(entity.entity as PolyLineEntity, parent);
        case 'Rct': return convertRectangle(entity.entity as RectangleEntity, parent);
        case 'Prt': return convertPart(entity.entity as PartEntity, entityIndex);
        case 'Syn': return convertSymbol(entity.entity as SymbolEntity, parent);
        default: throw new Error('Unknown entity identifier: ' + entity.entityIdentifier);
    }
}

function convertLine(entity: LineEntity, parent?: PartEntity) {
    const points = pointsToRD([entity.point1, entity.point2]);

    return {
        ...baseEntity(entity),
        geometry: 'LINESTRING(' + coordsList(points) + ')',
        attributes: {
            tool: 4,
            type: 'LineString',
            scaleFeature: false,
        },
        style: {
            label: '',
            strokeColor: entity.color,
            strokeOpacity: 1,
            strokeType: 0,
            strokeWidth: entity.lineWidth * 2,
        },
    };
}

function convertArc(entity: ArcEntity, parent?: PartEntity) {
    const points = pointsToRD([entity.point1, entity.point2]);

    if (entity.start === 0 && entity.extent === 360) {
        const midPoint = {
            x: points[0].x + ((points[1].x - points[0].x) / 2),
            y: points[0].y + ((points[1].y - points[0].y) / 2),
        };

        return {
            ...baseEntity(entity),
            geometry: 'POINT(' + coordsList([midPoint]) + ')',
            attributes: {
                tool: 2,
                type: 'Circle',
                radius: Math.abs(points[1].x - points[0].x) / 2,
            },
            style: {
                label: '',
                strokeColor: entity.color,
                strokeOpacity: 1,
                strokeType: 0,
                strokeWidth: entity.lineWidth * 2,
                ...convertFillType(entity),
            },
        }
    } else {
        throw new Error('Only full circle arcs supported');
    }
}

function convertPolyLine(entity: PolyLineEntity, parent?: PartEntity) {
    const rdPoints = pointsToRD(entity.pointList);

    const polygon = entity.typeList.endsWith("4");
    const coords = coordsList(rdPoints);

    return {
        ...baseEntity(entity),
        geometry: polygon ? `POLYGON((${coords}))` : `LINESTRING(${coords})`,
        attributes: {
            tool: polygon ? 3 : 4,
            type: polygon ? 'Polygon' : 'LineString',
        },
        style: {
            label: '',
            strokeColor: entity.color,
            strokeOpacity: entity.alpha,
            strokeType: 0,
            strokeWidth: entity.lineWidth * 2,
            ...convertFillType(entity),
        },
    };
}

function convertRectangle(entity: RectangleEntity, parent?: PartEntity) {
    const points = pointsToRD([entity.point1, entity.point2]);

    const polygonPoints = [
        points[0],
        { x: points[1].x, y: points[0].y},
        { x: points[1].x, y: points[1].y},
        points[1],
        { x: points[0].x, y: points[1].y},
        points[0],
    ];
    return {
        ...baseEntity(entity),
        geometry: `POLYGON((${coordsList(polygonPoints)}))`,
        attributes: {
            tool: 3,
            type: 'Polygon',
        },
        style: {
            label: '',
            strokeColor: entity.color,
            strokeOpacity: entity.alpha,
            strokeType: 0,
            strokeWidth: entity.lineWidth * 2,
            ...convertFillType(entity),
        },
    };
}

function convertPart(entity: PartEntity, entityIndex: EntityIndex, parent?: PartEntity) {
    if (!entity.children || entity.children.length === 0) {
        return [];
    }
    return entity.children
        .map(child => convertEntity(entityIndex[child], entityIndex, entity))
        .filter(converted => converted != null);
}

const symbolMap: { [key: string]: string} = {
    'Brandweer_voertuig-1.gif': 'B03',
    'Brandweer-1.gif': 'B01-C',
    'Ziekenhuis_functionerend-1.gif': 'A11',
    'GHOR_voertuig-1.gif': 'C03',
}

function convertSymbol(entity: SymbolEntity, parent?: PartEntity) {
    if (!parent) {
        return null;
    }

    const symbol = symbolMap[entity.symbol.symbolId] || 's0460';

    const points = pointsToRD([parent.origin]);
    return {
        ...baseEntity(entity),
        geometry: `POINT(${coordsList(points)})`,
        attributes: {
            tool: 5,
            type: 'Point',
            scaleFeature: false,
            symbol,
        },
        style: {
            label: '',
            fontSize: 13,
            halo: '#ffffff',
            showLabel: false,
            textColor: '#000000',
            fillColor: '',
            fillOpacity: 0.2,
            strokeColor: '',
        }
    };
}

function baseEntity(entity: ActionLayerEntity) {
    return {
        id: entity.id,
        name: entity.id,
        showInLegend: false,
        zIndex: entity.zLevel,
    };
}

function convertFillType(entity: {fillType: FillType}) {
    return entity.fillType && entity.fillType.paint && entity.fillType.paint.color1 ?
        { fillColor: (entity.fillType.paint.color1 & 0xffffff).toString(16), fillOpacity: 0.5} : null;
}
