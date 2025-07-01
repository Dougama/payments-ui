// src/utils/data-generator.ts
import { env } from "@/config/environment";
import faker from "faker";

// Set locale to Spanish (Colombia)
faker.locale = "es";

export interface GeneratedUserData {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  legalId: string;
  legalIdType: "CC" | "CE" | "NIT" | "PP";
}

export interface GeneratedAddressData {
  addressLine1: string;
  city: string;
  region: string;
  phoneNumber: string;
  country: string;
}

export class DataGenerator {
  private static colombianCities = [
    { city: "Bogotá", region: "Cundinamarca" },
    { city: "Medellín", region: "Antioquia" },
    { city: "Cali", region: "Valle del Cauca" },
    { city: "Barranquilla", region: "Atlántico" },
    { city: "Cartagena", region: "Bolívar" },
    { city: "Bucaramanga", region: "Santander" },
    { city: "Pereira", region: "Risaralda" },
    { city: "Santa Marta", region: "Magdalena" },
    { city: "Ibagué", region: "Tolima" },
    { city: "Manizales", region: "Caldas" },
  ];

  private static legalIdTypes: Array<"CC" | "CE" | "NIT" | "PP"> = [
    "CC",
    "CE",
    "NIT",
    "PP",
  ];

  static generateUserData(): GeneratedUserData {
    const firstName = faker.name.firstName();
    const lastName = faker.name.lastName();
    const legalIdType = faker.random.arrayElement(
      this.legalIdTypes.filter((type) => type !== "NIT")
    );

    return {
      email: faker.internet.email(firstName, lastName).toLowerCase(),
      password: env.get("DEFAULT_PWD"), // Fixed password for testing
      fullName: `${firstName} ${lastName}`,
      phoneNumber: this.generateColombianPhone(),
      legalId: this.generateLegalId(legalIdType),
      legalIdType,
    };
  }

  static generateAddressData(): GeneratedAddressData {
    const cityData = faker.random.arrayElement(this.colombianCities);

    return {
      addressLine1: `${faker.address.streetAddress()} ${faker.datatype.number({
        min: 1,
        max: 200,
      })}-${faker.datatype.number({ min: 1, max: 99 })}`,
      city: cityData.city,
      region: cityData.region,
      phoneNumber: this.generateColombianPhone(),
      country: "CO",
    };
  }

  static generateCheckoutData() {
    const userData = this.generateUserData();
    const addressData = this.generateAddressData();

    return {
      customerData: {
        email: userData.email,
        fullName: userData.fullName,
        phoneNumber: userData.phoneNumber,
        phoneNumberPrefix: "+57",
        legalId: userData.legalId,
        legalIdType: userData.legalIdType,
      },
      shippingAddress: {
        ...addressData,
      },
    };
  }

  private static generateColombianPhone(): string {
    // Generate Colombian mobile number (starts with 3)
    const prefix = "3";
    const rest = faker.datatype.number({ min: 100000000, max: 999999999 });
    return `${prefix}${rest}`;
  }

  private static generateLegalId(type: "CC" | "CE" | "NIT" | "PP"): string {
    switch (type) {
      case "CC": // Cédula de ciudadanía (6-10 digits)
        return faker.datatype
          .number({ min: 1000000, max: 9999999999 })
          .toString();
      case "CE": // Cédula de extranjería (6-7 digits)
        return faker.datatype.number({ min: 100000, max: 9999999 }).toString();
      case "NIT": // NIT (9-10 digits)
        return faker.datatype
          .number({ min: 100000000, max: 9999999999 })
          .toString();
      case "PP": // Passport
        return faker.random.alphaNumeric(8).toUpperCase();
      default:
        return faker.datatype
          .number({ min: 1000000, max: 9999999999 })
          .toString();
    }
  }

  static generateCompanyData() {
    const companyName = faker.company.companyName();

    return {
      customerData: {
        email: faker.internet.email(companyName).toLowerCase(),
        fullName: `${companyName} SAS`,
        phoneNumber: this.generateColombianPhone(),
        phoneNumberPrefix: "+57",
        legalId: this.generateLegalId("NIT"),
        legalIdType: "NIT" as const,
      },
      shippingAddress: this.generateAddressData(),
    };
  }
}
