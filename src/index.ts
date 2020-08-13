import './polyfills';
import {ActionLayerEntities, ActionLayerEntityBase} from "./in.models";
import {convertEntity, EntityIndex, LogFunction} from "./entity";

export interface ConversionResult {
    succeeded: boolean;
    message: string;
    featureCount: number;
    output?: string;
}

export function hello(): string {
    return "PlotConverter works!";
}

const err = (message: string): ConversionResult => ({ succeeded: false, message, featureCount: 0});

export function convert(json: string, log?: LogFunction): ConversionResult {
    let input: ActionLayerEntities;
    let message = "";
    if (!log) {
        log = (s: string) => { message += s + "\n" };
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

    let convertedCount = 0;
    input.topEntityIds.forEach(id => {
        const entity = entityIndex[id];
        if (!entity) {
            log(`Can't find top entity ID {$id}`);
            return;
        }
        const converted = convertEntity(entity, entityIndex, null, log);
        if (converted) {
            //log(`Converted entity ${entity.entityIdentifier} with ID ${id}`, entity, converted);
            if (Array.isArray(converted)) {
                features = features.concat(converted);
            } else {
                features.push(converted);
            }
        }
        convertedCount++;
    });

    let result = `Converted ${convertedCount} out of ${input.topEntityIds.length} entities resulting in ${features.length} new features`;
    if (message !== "") {
        result = result + ", log:\n" + message.trimRight();
    }

    return {
        succeeded: true,
        message: result,
        featureCount: features.length,
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
