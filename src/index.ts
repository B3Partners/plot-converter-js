import {ActionLayerEntities, ActionLayerEntity, ActionLayerEntityBase, Point} from "./in.models";
import {RDtoWSG84, WGS84ToRD} from "./proj";
import 'core-js/es/map';

interface ConversionResult {
    succeeded: boolean;
    message: string;
    output?: string;
}

export function hello(): string {
    return "PlotJsonConverter works!";
}

const e = (message: string): ConversionResult => ({ succeeded: false, message});

if(!global['console']) {
    // @ts-ignore
    global['console'] = { log: () => {}};
}

export function convert(json: string): ConversionResult {
    let input: ActionLayerEntities;
    try {
        input = JSON.parse(json);
    } catch(e) {
        return e('Error parsing JSON: ' + e);
    }

    if(input.version !== 20161115) {
        return e('Unknown version: ' + input.version);
    }

    const entityIndex = indexEntities(input.entityList);

    const converted: any[] = [];

    input.topEntityIds.forEach((id, index) => {
        const entity = entityIndex.get(id);
        if (!entity) {
            // TODO add message to log
            return;
        }
        try {
            converted.push({
                ...convertEntity(entity),
                zIndex: index,
            });
        } catch(e) {
            // TODO add message about conversion error
            console.log(`Error converting entity ${id}: ${e}`);
        }
    });

    return {
        succeeded: true,
        message: 'Aantal top entities: ' + input.topEntityIds.length,
        output: JSON.stringify(converted, null, 2),
    };
}

function indexEntities(input: ActionLayerEntityBase[]): Map<string,ActionLayerEntityBase> {
    const map = new Map<string, ActionLayerEntityBase>();
    input.forEach(entity => {
        map.set(entity.entity.id, entity);
    });
    return map;
}

function convertEntity(entity: ActionLayerEntityBase): any {
    switch(entity.entityIdentifier) {
        case 'PLn': return convertPolygon(entity.entity);
        default: throw new Error('Unknown entity identifier: ' + entity.entityIdentifier);
    }
}

function convertPolygon(entity: ActionLayerEntity) {
    const rdPoints = pointsToRD(entity.pointList);

    return {
        id: entity.id,
        name: entity.id,
        geometry: 'POLYGON((' + rdPoints.map(p => p.x + ' ' + p.y).join(',') + '))',
        attributes: {
            tool: 3,
            type: 'Polygon',
            scaleFeature: false,
        },
        style: {
            label: '',
            fillColor: entity.fillType ? entity.fillType.color : '',
            fillOpacity: 0.5,
            strokeColor: entity.fillType ? entity.fillType.color : '',
            strokeOpacity: 1,
            strokeType: 0,
            strokeWidth: entity.lineWidth,
        },
        showInLegend: false,
        selectableFeature: true,
    };
}

function pointsToRD(points: Point[]): Point[] {
    return points.map(p => WGS84ToRD(p.y, p.x)).map(coords => ({ x: coords[0], y: coords[1]}));
}