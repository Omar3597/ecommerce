export function toAddressResponse(address: any) {
  return {
    id: address.id,
    fullName: address.fullName,
    phone: address.phone,
    city: address.city,
    street: address.street,
    building: address.building,
    userId: address.userId,
    createdAt: address.createdAt,
    updatedAt: address.updatedAt,
    isModified:
      new Date(address.updatedAt).getTime() >
      new Date(address.createdAt).getTime(),
  };
}

export function toAddressesResponse(addresses: any[]) {
  return addresses.map(toAddressResponse);
}
