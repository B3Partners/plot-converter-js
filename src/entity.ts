import {
    ActionLayerEntity,
    ActionLayerEntityBase,
    ArcEntity,
    FillType,
    LineEntity,
    LineType,
    PartEntity,
    Point,
    PolyArrowEntity,
    PolyLineEntity,
    RectangleEntity,
    StrokeTextEntity,
    SymbolEntity,
    Transform
} from "./in.models";
import {coordsList, pointsToRD, pointToCoordinate, toHexColor, toStrokeWidth} from "./util";
// @ts-ignore
import quadratic from 'adaptive-quadratic-curve';
// @ts-ignore
import bezier from 'adaptive-bezier-curve';

export type EntityIndex = { [key: string]: ActionLayerEntityBase};

export function convertEntity(entity: ActionLayerEntityBase, entityIndex: EntityIndex, parent?: PartEntity): any {
    switch(entity.entityIdentifier) {
        case 'Lne': return convertLine(entity.entity as LineEntity, parent);
        case 'Arc': return convertArc(entity.entity as ArcEntity, parent);
        case 'PLn': return convertPolyLine(entity.entity as PolyLineEntity, parent);
        case 'PAr': return convertPolyArrow(entity.entity as PolyArrowEntity, parent);
        case 'Spl': return convertSmoothPolyLine(entity.entity as PolyLineEntity, parent);
        case 'Rct': return convertRectangle(entity.entity as RectangleEntity, parent);
        case 'Prt': return convertPart(entity.entity as PartEntity, entityIndex);
        case 'Syn': return convertSymbol(entity.entity as SymbolEntity, parent);
        case 'STx': return convertText(entity.entity as StrokeTextEntity, parent);
        default:
            //console.log('Unknown entity', entity, parent);
            throw new Error('Unsupported entity: ' + entity.entityIdentifier);
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
            ...convertStyle(entity),
        },
    };
}

function convertArc(entity: ArcEntity, parent?: PartEntity): any {

    if (isCircle(entity)) {
        return convertCircleArc(entity);
    } else {
        return convertEllipseArc(entity);
    }
}

function isCircle(entity: { point1: Point, point2: Point}): boolean {
    const points = pointsToRD([entity.point1, entity.point2]);
    const rx = Math.abs(points[0].x - points[1].x);
    const ry = Math.abs(points[0].y - points[1].y);
    return Math.abs(rx-ry) < 0.000001;
}

function convertCircleArc(entity: ArcEntity): any {
    const points = pointsToRD([entity.point1, entity.point2]);
    const midPoint = {
        x: points[0].x + ((points[1].x - points[0].x) / 2),
        y: points[0].y + ((points[1].y - points[0].y) / 2),
    };
    const radius = Math.abs(points[1].x - points[0].x) / 2;
    if (entity.start === 0 && entity.extent === 360) {
        return {
            ...baseEntity(entity),
            geometry: 'POINT(' + coordsList([midPoint]) + ')',
            attributes: {
                tool: 2,
                type: 'Circle',
                radius,
            },
            style: {
                label: '',
                ...convertStyle(entity),
            },
        };
    } else {
        const circlePoints: Point[] = [];
        const startAngle = entity.extent < 360 ? entity.start : 0;
        const endAngle = entity.extent;
        const vertices = 64;
        for (let i = 0; i < vertices; i++) {
            const angle = startAngle + (i * endAngle / vertices);
            circlePoints.push({
                x: midPoint.x + radius * Math.cos(angle * Math.PI/180),
                y: midPoint.y - radius * Math.sin(angle * Math.PI/180),
            });
        }
        const coords = coordsList(circlePoints);

        return {
            ...baseEntity(entity),
            geometry: `LINESTRING(${coords})`,
            attributes: {
                tool: 4,
                type: 'LineString',
            },
            style: {
                label: '',
                ...convertStyle(entity),
            },
        };
    }
}

function convertEllipseArc(entity: ArcEntity): any {
    const points = pointsToRD([entity.point1, entity.point2]);
    const midPoint = {
        x: points[0].x + ((points[1].x - points[0].x) / 2),
        y: points[0].y + ((points[1].y - points[0].y) / 2),
    };
    const rx = Math.abs(points[1].x - points[0].x) / 2;
    const ry = Math.abs(points[1].y - points[0].y) / 2;

    if (entity.extent < entity.start) {
        const temp = entity.extent;
        entity.extent = entity.start;
        entity.start = temp;
    }

    const vertices = 64;
    const ellipsePoints: Point[] = [];
    for (let i = 0; i < vertices; i++) {
        const angle = i * 360 / vertices;
        if(angle >= entity.start && angle <= entity.extent) {
            const t = Math.tan(i * (2 * Math.PI / vertices));
            ellipsePoints.push({
                x: midPoint.x + rx * (1 - t ** 2) / (1 + t ** 2),
                y: midPoint.y + ry * 2 * t / (1 + t ** 2),
            });
        }
    }

    if(ellipsePoints.length === 0) {
        return [];
    }
    const coords = coordsList(ellipsePoints);
    const isClosed = Math.abs(entity.start % 360) === Math.abs(entity.extent % 360);

    if (isClosed) {
        const isClosedPolygon = ellipsePoints[0].x === ellipsePoints[ellipsePoints.length - 1].x &&
            ellipsePoints[0].y === ellipsePoints[ellipsePoints.length - 1].y;

        if (!isClosedPolygon) {
            ellipsePoints.push(ellipsePoints[0]);
        }
    }

    return {
        ...baseEntity(entity),
        geometry: isClosed ? `POLYGON((${coords}))` : `LINESTRING(${coords})`,
        attributes: {
            tool: isClosed? 3 : 4,
            type: isClosed ? 'Polygon' : 'LineString',
        },
        style: {
            label: '',
            ...convertStyle(entity),
        },
    };
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
            ...convertStyle(entity),
        },
    };
}

function convertPolyArrow(entity: PolyArrowEntity, parent?: PartEntity) {
    const rdPoints = pointsToRD(entity.pointList);
    const coords = coordsList(rdPoints);

    let arrow = 0;
    if (entity.style.arrowStart && entity.style.arrowEnd) {
        arrow = 3;
    } else if (entity.style.arrowStart) {
        arrow = 1;
    } else if (entity.style.arrowEnd) {
        arrow = 2;
    }

    return {
        ...baseEntity(entity),
        geometry: `LINESTRING(${coords})`,
        attributes: {
            tool: 4,
            type: 'LineString',
        },
        style: {
            label: '',
            ...convertStyle({
                alpha: entity.alpha,
                lineType: entity.style.lineType,
                lineWidth: toStrokeWidth(entity.style.lineWeight),
                color: toHexColor(entity.style.color),
            }),
            arrow,
        },
    };
}

function convertSmoothPolyLine(entity: PolyLineEntity, parent?: PartEntity) {
    const rdCoords = pointsToRD(entity.pointList).map(pointToCoordinate);

    let idx = 0;
    const smoothedCoords = [rdCoords[0]];
    let polygon = false;
    for(let i = 0; i < entity.typeList.length; i++) {
        const segmentType = entity.typeList.charAt(i);

        if (segmentType === '0' || segmentType === '1') {
            smoothedCoords.push(rdCoords[idx++]);
        } else if (segmentType === '2') {
            quadratic(rdCoords[idx - 1], rdCoords[idx], rdCoords[idx + 1], 1, smoothedCoords);
            idx += 2;
        } else if (segmentType === '3') {
            bezier(rdCoords[idx - 1], rdCoords[idx], rdCoords[idx + 1], rdCoords[idx + 2], 1, smoothedCoords);
            idx += 3;
        } else if (segmentType === '4') {
            polygon = true;
        } else {
            throw "Unknown segment type in spline: " + segmentType;
        }
    }

    const coords = coordsList(smoothedCoords);

    return {
        ...baseEntity(entity),
        geometry: polygon ? `POLYGON((${coords}))` : `LINESTRING(${coords})`,
        attributes: {
            tool: polygon ? 3 : 4,
            type: polygon ? 'Polygon' : 'LineString',
        },
        style: {
            label: '',
            ...convertStyle(entity),
        },
    };
}

function convertRectangle(entity: RectangleEntity, parent?: PartEntity) {
    const points = pointsToRD([entity.point1, entity.point2]);

    const polygonPoints = transformPoints(entity, [
        points[0],
        { x: points[1].x, y: points[0].y},
        { x: points[1].x, y: points[1].y},
        points[1],
        { x: points[0].x, y: points[1].y},
        points[0],
    ]);
    return {
        ...baseEntity(entity),
        geometry: `POLYGON((${coordsList(polygonPoints)}))`,
        attributes: {
            tool: 3,
            type: 'Polygon',
        },
        style: {
            label: '',
            ...convertStyle(entity),
        },
    };
}

function flatDeep<T>(arr: Array<T>, d = 1): Array<T> {
    return d > 0 ? arr.reduce((acc, val) => acc.concat(Array.isArray(val) ? flatDeep(val, d - 1) : val), [])
        : arr.slice();
}

function convertPart(entity: PartEntity, entityIndex: EntityIndex, parent?: PartEntity) {
    if (!entity.children || entity.children.length === 0) {
        return [];
    }

    const gasMal = convertGasMal(entity);
    if (gasMal) {
        return gasMal;
    }

    return flatDeep(entity.children
        .map(child => convertEntity(entityIndex[child], entityIndex, entity))
        .filter(converted => converted != null));
}

function convertGasMal(entity: PartEntity) {
    const gasMalAttribute = entity.attributes.find(a => a.name === 'GasMal');
    if (!gasMalAttribute) {
        return null;
    }

    const attr = (name: string) => gasMalAttribute.attributeItems.find((ai: { name: string; attributeValue: string }) => ai.name === name).attributeValue;

    const nummer = Number(attr('Nummer'));
    const kleur = attr('Kleur');
    const hoek = Number(attr('Hoek'));
    const lat = Number(attr('originLat'));
    const lon = Number(attr('originLon'));

    const points = pointsToRD([{x: lon, y: lat}]);
    return {
        ...baseEntity(entity),
        geometry: `POINT(${coordsList(points)})`,
        attributes: {
            tool: 8,
            type: 'Point',
            windDirection: hoek,
            malColor: kleur,
            malNumber: nummer,
        },
        style: {
        },
    };
}

const symbolMap: { [key: string]: string} = {
    'GHOR-1.gif': 'C01-C',
    'GHOR_Ambulancestation-1.gif': 'C07',
    'GHOR_Behandelcentrum-1.gif': 'C04',
    'Huisartsenpost-1.gif': 's1020',
    'GHOR_loodspost-1.gif': 'C02',
    'GHOR_mobiele_locatie-1.gif': 'C06',
    'GHOR_OVD-1.gif': 'C01-A',
    'GHOR_vaste_locatie-1.gif': 'C05',
    'GHOR_voertuig-1.gif': 'C03',

    'Brandweer-1.gif': 'B01-C',
    'Brandweer_blusboot-1.gif': 'B04',
    'Brandweer_voertuig-1.gif': 'B03',
    'Brandweer_Bluswatervoorziening-1.gif': 'B06',
    'Brandkraan_100mm-1.gif': 'B07',
    'Brandkraan_150mm-1.gif': 'B08',
    'Brandkraan_200mm-1.gif': 'B09',
    'Brandstofvoorziening-1.gif': 'B14',
    'Brandweer_decontaminatie-1.gif': 'B13',
    'Brandweer_meetploeg-1.gif': 'B05',
    'Brandweer_mobiele_locatie-1.gif': 'B11',
    'Brandweer_ontsmettingssluis-1.gif': 'B12',
    'Brandweer_OVD-1.gif': 'B01-A',
    'Brandweer_Uitgangsstelling-1.gif': 's0870_B03',
    'Brandweer_vaste_locatie-1.gif': 'B10',

    'Gemeente-1.gif': 'E01-B',
    'Beschikbaar_groot_gebouw-1.gif': 's1040',
    'Mortuarium-1.gif': 'E04',
    'Gemeente_opvanglocatie-1.gif': 'E02',
    'Verzamelplaats_doden-1.gif': 'E05',
    'Gemeente_voertuig-1.gif': 'E03',

    'COPI-1.png': 'A07',
    'Incidentlocatie-1.png': 'incidentlocatie',

    'Afgesloten_Weg-1.gif': 'A05',
    'Politie-1.gif': 's0490_D01-B',
    'Politie_Detentievoorziening-1.gif': 'D05',
    'Politie_mobiele_locatie-1.gif': 'D03',
    'Politie_OVD-1.gif': 'D01-A',
    'Politie_plaatsdelict-1.gif': 'D06',
    'Politie_Sporenonderzoek_Technische_recherche-1.gif': 'D08',
    'Politie_vaste_locatie-1.gif': 'D02',
    'Verzegeld_pand-1.gif': 'A04',
    'Politie_voertuig-1.gif': 'D04',
    'Politie_werkruimte_TR-1.gif': 'D07',
    'Politie_wegblokade-1.gif': 'D01-B',

    'Algemeen-1.gif': 's0460',
    'Defensie-1.gif': 'F02',
//    'Kazerne_Defensie-1.gif': '',
    'Logistiek_punt-1.gif': 's0730',
    'Provincie-1.gif': 'F04',
    'Materialenpost_RWS-1.gif': 's1050',
    'Sirene-1.gif': 'A09',
    'Spoorwegen-1.gif': 'F01',
    'Waterschap-1.gif': 'F03',

    'Ziekenhuis_functionerend-1.gif': 'A11',
}

function convertSymbol(entity: SymbolEntity, parent?: PartEntity) {
    if (!parent || !(!parent.origin || !entity.symbol.lowerLeft)) {
        return null;
    }
    const scaleFeature = !(parent && parent.pixelScale);
    const symbol = symbolMap[entity.symbol.symbolId] || 's0460';
    if (!symbolMap[entity.symbol.symbolId]) {
        throw new Error('Unknown symbol: ' + entity.symbol.symbolId);
    }

    const point = parent.origin ? parent.origin :
        {
            x: (entity.symbol.upperRight.x + entity.symbol.lowerLeft.x) / 2,
            y: (entity.symbol.upperRight.y + entity.symbol.lowerLeft.y) / 2,
        };
    const points = pointsToRD([point]);
    return {
        ...baseEntity(entity),
        name: parent.name,
        geometry: `POINT(${coordsList(points)})`,
        attributes: {
            tool: 5,
            type: 'Point',
            scaleFeature,
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

function convertText(entity: StrokeTextEntity, parent?: PartEntity) {
    const points = pointsToRD([parent && parent.origin ? parent.origin: entity.origin]);
    const scaleFeature = !(parent && parent.pixelScale);
    let textAlign = 'center';
    let textBaseline = 'middle';
    if ([1, 4, 7].indexOf(entity.style.reference) !== -1) {
        textAlign = 'left';
    }
    if ([3, 6, 9].indexOf(entity.style.reference) !== -1) {
        textAlign = 'right'
    }
    if ([1, 2, 3].indexOf(entity.style.reference) !== -1) {
        textBaseline = 'bottom';
    }
    if ([7, 8, 9].indexOf(entity.style.reference) !== -1) {
        textBaseline = 'top';
    }

    return {
        ...baseEntity(entity),
        name: entity.text,
        geometry: `POINT(${coordsList(points)})`,
        attributes: {
            tool: 1,
            type: 'Point',
            scaleFeature,
        },
        style: {
            label: entity.text,
            fontSize: scaleFeature ? entity.style.characterSize * 30 : entity.style.characterSize * 1.5,
            halo: '',
            showLabel: true,
            textColor: entity.style.characterColor,
            textBackgroundFill: entity.style.balloonType !== 0 ? entity.style.balloonFillType ? toHexColor(entity.style.balloonFillType.paint.color1) : '' : '',
            textBackgroundStroke: entity.style.balloonType !== 0 ? entity.style.balloonColor : '',
            textBackgroundStrokeWidth: toStrokeWidth(entity.style.balloonLineWidth),
            textAlign,
            textBaseline,
            rotation: 360 - entity.textAngle * 180/Math.PI,
        }
    };
}

function baseEntity(entity: ActionLayerEntity) {
    return {
        id: entity.id,
        name: entity.id,
        showInLegend: false,
        zIndex: -entity.zLevel,
    };
}

function transformPoints(entity: { transform?: Transform}, points: Point[]) {
    const t = entity.transform;
    if (points.length === 0 || (t && t.m00 === 1 && t.m10 === 0 && t.m01 === 0 && t.m11 === 1)) {
        return points;
    }
    const ref = points[0];
    return points.map(p => ({
       x: ((p.x - ref.x) * t.m00 + (p.y - ref.y) * t.m01) + ref.x,
       y: ((p.x - ref.x) * t.m10 + (p.y - ref.y) * t.m11) + ref.y,
    }));
}

function convertStyle(entity: {fillType?: FillType, lineType?: LineType, lineWidth?: number, color?: string, alpha?: number}) {
    let style = {
        fillOpacity: entity.fillType ? 0.5 : 0,
        fillColor: entity.fillType && entity.fillType.paint && entity.fillType.paint.color1
            ? toHexColor(entity.fillType.paint.color1) :
            '',
        strokeColor: entity.color,
        strokeOpacity: entity.alpha,
        strokeType: 0,
        strokeWidth: toStrokeWidth(entity.lineWidth),
    };
    if (entity.lineType && entity.lineType.name) {
        const lineTypeName = entity.lineType.name;
        if (lineTypeName.indexOf('dot') !== -1) {
            style.strokeType = 2;
        } else if (lineTypeName.indexOf('dash') !== -1) {
            style.strokeType = 1;
        }
    }
    return style;
}
