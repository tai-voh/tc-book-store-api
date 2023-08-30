"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSchema = exports.registry = void 0;
const confluent_schema_registry_1 = require("@kafkajs/confluent-schema-registry");
const registry = new confluent_schema_registry_1.SchemaRegistry({
    host: process.env.SCHEMA_REGISTRY_END_POINT || '127.0.0.1:8081',
});
exports.registry = registry;
const registerSchema = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const schema = yield (0, confluent_schema_registry_1.readAVSCAsync)("/utils/schema/avro/schema.avsc");
        const { id } = yield registry.register(schema);
        return id;
    }
    catch (e) {
        console.log(e);
    }
});
exports.registerSchema = registerSchema;
