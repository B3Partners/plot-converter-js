import {ActionLayerEntities, ActionLayerEntityBase} from "./in.models";
import {convertEntity, EntityIndex} from "./entity";

interface ConversionResult {
    succeeded: boolean;
    message: string;
    output?: string;
}

export function hello(): string {
    return "PlotConverter works!";
}

const err = (message: string): ConversionResult => ({ succeeded: false, message});

export function convert(json: string, log?: (...args: any[]) => void): ConversionResult {
    let input: ActionLayerEntities;
    if (!log) {
        log = () => {};
    }
    try {
        input = JSON.parse(json);
    } catch(e) {
        return err('Error parsing JSON: ' + e);
    }

    if(input.version !== 20161115) {
        return err('Unknown version: ' + input.version);
    }

    const entityIndex = indexEntities(input.entityList);

    let features: any[] = [];

    input.topEntityIds.forEach(id=> {
        const entity = entityIndex[id];
        if (!entity) {
            // TODO add message to log
            return;
        }
        try {
            const converted = convertEntity(entity, entityIndex);
            if (Array.isArray(converted)) {
                features = features.concat(converted);
            } else {
                features.push(converted);
            }
        } catch(e) {
            // TODO add message about conversion error
            log(`Error converting entity ${id}: ${e}`);
        }
    });

    /*
    input.entityList.forEach(entity => {
        try {
            converted.push(convertEntity(entity));
        } catch(e) {
            // TODO add message about conversion error
            log(`Error converting entity ${entity.entityIdentifier}: ${e}`);
        }
    });*/

    return {
        succeeded: true,
        message: 'Aantal top entities: ' + input.topEntityIds.length,
        output: JSON.stringify(features, null, 2),
    };
}

function indexEntities(input: ActionLayerEntityBase[]): EntityIndex {
    const map: { [key: string]: ActionLayerEntityBase} = {};
    input.forEach(entity => {
        map[entity.entity.id] = entity;
    });
    return map;
}
