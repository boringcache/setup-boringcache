"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CHECKSUMS = void 0;
exports.getChecksum = getChecksum;
exports.hasChecksums = hasChecksums;
exports.CHECKSUMS = {
    'v1.0.0': {
        'boringcache-alpine-amd64': '920d26c3bdd4277afe973a19ddc69315c7ded849469dfe3dad4767f3c954f791',
        'boringcache-arch-amd64': '94774d5cb205100b5363a521bc3755f84f79c09a2f426ffaf25ccb9797baa0b4',
        'boringcache-arch-arm64': 'c89372ca0ba89489c7f82709ca323bf4c6dafc89f4ebfcf106db7bcb0ae8a195',
        'boringcache-debian-bookworm-amd64': '165fdd88bcbf77f30c242daef418a9b970cb7f8bbd4bbf0801ec1693ae40481b',
        'boringcache-debian-bookworm-arm64': '8440bc6fd7d3c55eeaf2f63a7d899eab7c73be7b3726a59633b38c8f5176dcb5',
        'boringcache-debian-bullseye-amd64': '2b4b04070449a492646a26b8ff13bed3ce709b25865fe657f49ca43bb3653ba7',
        'boringcache-debian-bullseye-arm64': '3e113280e579d1273b44672be2eacc30489a5423339579b54ff452bb4ac52629',
        'boringcache-linux-amd64': '23575d642408816df72e36f5722fe08c908957cab354fce4dfa9d84c8b1f46fd',
        'boringcache-linux-arm64': 'a1ff842b0f769a26061f0545ab6e9fd7b29ff28886547a0b212ee33f6ff4e1f5',
        'boringcache-macos-14-arm64': '346044af2f65ff16e21b819d1b6d3f9e17f3767d56d11bf7259822efba59e953',
        'boringcache-macos-15-arm64': '890ec46721924c4e4c6343b0c9732a2fad889b6437ddff7d1f7bd30b6e57b047',
        'boringcache-ubuntu-22.04-amd64': '23575d642408816df72e36f5722fe08c908957cab354fce4dfa9d84c8b1f46fd',
        'boringcache-ubuntu-22.04-arm64': 'a1ff842b0f769a26061f0545ab6e9fd7b29ff28886547a0b212ee33f6ff4e1f5',
        'boringcache-ubuntu-24.04-amd64': '918ba5f58eaa3e6c7f1e7c27972fff5a07650784975930f1f1db26b1da2db8cd',
        'boringcache-ubuntu-24.04-arm64': '6c756565c49ec46277f5c45c3f73eeff3e4cf8aae4ae70c927acf28d377ceca2',
        'boringcache-ubuntu-25.04-amd64': 'a177c1e06672e9e7dc686f33c481fe715560925275e20a23757c7fe43b2be4f7',
        'boringcache-ubuntu-25.04-arm64': '71ed5956eda5dd02a6737dd69bf397fd4b18713576aaf4b70ce06ed39e254750',
        'boringcache-windows-2022-amd64.exe': '5ef5134271ab8a3f102618af4359070009e82b9b0bedeee2137ba5acbd97f12c',
    },
};
function getChecksum(version, asset) {
    var _a;
    return (_a = exports.CHECKSUMS[version]) === null || _a === void 0 ? void 0 : _a[asset];
}
function hasChecksums(version) {
    return version in exports.CHECKSUMS;
}
