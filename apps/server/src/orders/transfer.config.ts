export const TRANSFER_RADIUS_KM = Number.parseFloat(
    process.env.TRANSFER_RADIUS_KM ?? '10',
);

export const TRANSFER_OFFER_EXPIRATION_MINUTES = Number.parseInt(
    process.env.TRANSFER_OFFER_EXPIRATION_MINUTES ?? '15',
    10,
);

if (!Number.isFinite(TRANSFER_RADIUS_KM) || TRANSFER_RADIUS_KM <= 0) {
    throw new Error('TRANSFER_RADIUS_KM must be a positive number in kilometers');
}

if (
    !Number.isInteger(TRANSFER_OFFER_EXPIRATION_MINUTES) ||
    TRANSFER_OFFER_EXPIRATION_MINUTES <= 0
) {
    throw new Error(
        'TRANSFER_OFFER_EXPIRATION_MINUTES must be a positive integer',
    );
}
