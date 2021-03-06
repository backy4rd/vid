import * as _ from "lodash";
import { expect } from "chai";
import { Request, Response, NextFunction } from "express";

export function mustExist(...requestKeyPaths: string[]) {
    return function (target: Object, propertyKey: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;

        descriptor.value = function (req: Request, res: Response, next: NextFunction) {
            const isAllExist = requestKeyPaths.every((keyPath) => {
                const value = _.get(req, keyPath);
                return value !== undefined && value !== "";
            });

            expect(isAllExist, "400:missing parameter").to.be.true;

            return method.apply(this, arguments);
        };
    };
}

export function mustExistOne(...requestKeyPaths: string[]) {
    return function (target: Object, propertyKey: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;

        descriptor.value = function (req: Request, res: Response, next: NextFunction) {
            const isExistOne = requestKeyPaths.some((keyPath) => {
                const value = _.get(req, keyPath);
                return value !== undefined && value !== "";
            });

            expect(isExistOne, "400:missing parameter").to.be.true;

            return method.apply(this, arguments);
        };
    };
}

export function isNumber(...requestKeyPaths: string[]) {
    return function (target: Object, propertyKey: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;

        descriptor.value = function (req: Request, res: Response, next: NextFunction) {
            const isAllNumber = requestKeyPaths.every((keyPath) => {
                const value = _.get(req, keyPath);
                return !isNaN(+value);
            });

            expect(isAllNumber, "400:invalid parameter").to.be.true;

            return method.apply(this, arguments);
        };
    };
}

export function isNumberIfExist(...requestKeyPaths: string[]) {
    return function (target: Object, propertyKey: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;

        descriptor.value = function (req: Request, res: Response, next: NextFunction) {
            const isAllNumber = requestKeyPaths.every((keyPath) => {
                const value = _.get(req, keyPath);
                return !isNaN(+value) || value === undefined;
            });

            expect(isAllNumber, "400:invalid parameter").to.be.true;

            return method.apply(this, arguments);
        };
    };
}

export function isBinary(...requestKeyPaths: string[]) {
    return function (target: Object, propertyKey: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;

        descriptor.value = function (req: Request, res: Response, next: NextFunction) {
            const isAllBinary = requestKeyPaths.every((keyPath) => {
                const value = _.get(req, keyPath);
                return value === "1" || value === "0";
            });

            expect(isAllBinary, "400:invalid parameter").to.be.true;

            return method.apply(this, arguments);
        };
    };
}

export function isBinaryIfExist(...requestKeyPaths: string[]) {
    return function (target: Object, propertyKey: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;

        descriptor.value = function (req: Request, res: Response, next: NextFunction) {
            const isAllBinary = requestKeyPaths.every((keyPath) => {
                const value = _.get(req, keyPath);
                return value === "1" || value === "0" || value === undefined;
            });

            expect(isAllBinary, "400:invalid parameter").to.be.true;

            return method.apply(this, arguments);
        };
    };
}

export function isDateFormat(...requestKeyPaths: string[]) {
    return function (target: Object, propertyKey: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;

        descriptor.value = function (req: Request, res: Response, next: NextFunction) {
            const isAllDateFormat = requestKeyPaths.every((keyPath) => {
                const value = _.get(req, keyPath);
                return !isNaN(Date.parse(value));
            });

            expect(isAllDateFormat, "400:invalid parameter").to.be.true;

            return method.apply(this, arguments);
        };
    };
}

export function isDateFormatIfExist(...requestKeyPaths: string[]) {
    return function (target: Object, propertyKey: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;

        descriptor.value = function (req: Request, res: Response, next: NextFunction) {
            const isAllDateFormat = requestKeyPaths.every((keyPath) => {
                const value = _.get(req, keyPath);
                return !isNaN(Date.parse(value)) || value === undefined;
            });

            expect(isAllDateFormat, "400:invalid parameter").to.be.true;

            return method.apply(this, arguments);
        };
    };
}
