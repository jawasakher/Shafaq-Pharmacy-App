import {
    BadRequestException,
    Injectable,
    ServiceUnavailableException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

type PricingResult = {
    supported: boolean;
    distance: Prisma.Decimal;
    distanceUnit: 'KM';
    deliveryFee: Prisma.Decimal;
    currency: 'SYP';
    pricingConfigurationVersion: string;
    pricingStrategy: 'DISTANCE_BASED';
    pricingConfigurationRef: string;
    calculatedAt: Date;
};

@Injectable()
export class DeliveryPricingService {
    calculate(input: {
        originLatitude: Prisma.Decimal;
        originLongitude: Prisma.Decimal;
        destinationLatitude: Prisma.Decimal;
        destinationLongitude: Prisma.Decimal;
    }): PricingResult {
        const originLatitude = Number(input.originLatitude);
        const originLongitude = Number(input.originLongitude);
        const destinationLatitude = Number(input.destinationLatitude);
        const destinationLongitude = Number(input.destinationLongitude);

        this.validateCoordinate(originLatitude, -90, 90, 'origin latitude');
        this.validateCoordinate(originLongitude, -180, 180, 'origin longitude');
        this.validateCoordinate(
            destinationLatitude,
            -90,
            90,
            'destination latitude',
        );
        this.validateCoordinate(
            destinationLongitude,
            -180,
            180,
            'destination longitude',
        );

        const distanceKm = this.haversineKm(
            originLatitude,
            originLongitude,
            destinationLatitude,
            destinationLongitude,
        );

        const baseFee = this.requiredDecimalEnv(
            'SHAFAQ_PRICING_BASE_FEE',
        );
        const perKm = this.requiredDecimalEnv(
            'SHAFAQ_PRICING_PER_KM',
        );
        const version =
            process.env.SHAFAQ_PRICING_VERSION?.trim() || 'v1';
        const configurationRef =
            process.env.SHAFAQ_PRICING_CONFIGURATION_REF?.trim() ||
            'shafaq-distance-pricing-v1';

        const maxDistanceRaw =
            process.env.SHAFAQ_PRICING_MAX_DISTANCE_KM?.trim();

        if (maxDistanceRaw) {
            const maxDistance = Number(maxDistanceRaw);

            if (
                !Number.isFinite(maxDistance) ||
                maxDistance < 0
            ) {
                throw new ServiceUnavailableException(
                    'Pricing configuration is invalid',
                );
            }

            if (distanceKm > maxDistance) {
                return {
                    supported: false,
                    distance: new Prisma.Decimal(
                        distanceKm.toFixed(6),
                    ),
                    distanceUnit: 'KM',
                    deliveryFee: new Prisma.Decimal(0),
                    currency: 'SYP',
                    pricingConfigurationVersion: version,
                    pricingStrategy: 'DISTANCE_BASED',
                    pricingConfigurationRef: configurationRef,
                    calculatedAt: new Date(),
                };
            }
        }

        const distance = new Prisma.Decimal(
            distanceKm.toFixed(6),
        );

        const deliveryFee = baseFee
            .plus(distance.mul(perKm))
            .toDecimalPlaces(2);

        return {
            supported: true,
            distance,
            distanceUnit: 'KM',
            deliveryFee,
            currency: 'SYP',
            pricingConfigurationVersion: version,
            pricingStrategy: 'DISTANCE_BASED',
            pricingConfigurationRef: configurationRef,
            calculatedAt: new Date(),
        };
    }

    private requiredDecimalEnv(name: string): Prisma.Decimal {
        const raw = process.env[name]?.trim();

        if (!raw) {
            throw new ServiceUnavailableException(
                'Pricing configuration is unavailable',
            );
        }

        try {
            const value = new Prisma.Decimal(raw);

            if (value.isNegative()) {
                throw new Error('negative');
            }

            return value;
        } catch {
            throw new ServiceUnavailableException(
                'Pricing configuration is invalid',
            );
        }
    }

    private validateCoordinate(
        value: number,
        min: number,
        max: number,
        label: string,
    ) {
        if (!Number.isFinite(value) || value < min || value > max) {
            throw new BadRequestException(
                `Invalid ${label}`,
            );
        }
    }

    private haversineKm(
        latitude1: number,
        longitude1: number,
        latitude2: number,
        longitude2: number,
    ) {
        const earthRadiusKm = 6371;

        const latitudeDelta =
            this.toRadians(latitude2 - latitude1);
        const longitudeDelta =
            this.toRadians(longitude2 - longitude1);

        const a =
            Math.sin(latitudeDelta / 2) ** 2 +
            Math.cos(this.toRadians(latitude1)) *
                Math.cos(this.toRadians(latitude2)) *
                Math.sin(longitudeDelta / 2) ** 2;

        return (
            earthRadiusKm *
            2 *
            Math.atan2(
                Math.sqrt(a),
                Math.sqrt(1 - a),
            )
        );
    }

    private toRadians(value: number) {
        return (value * Math.PI) / 180;
    }
}
