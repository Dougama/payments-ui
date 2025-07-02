// src/utils/data-generator.ts
import { faker } from "@faker-js/faker/locale/es";
import { env } from "@/config/environment";

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
  department: string;
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
  ];

  static generateUserData(): GeneratedUserData {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const legalIdType = faker.helpers.arrayElement(
      this.legalIdTypes.filter((type) => type !== "NIT")
    );

    return {
      email: faker.internet.email({ firstName, lastName }).toLowerCase(),
      password: env.get("DEFAULT_PWD"), // Get password from environment variable
      fullName: `${firstName} ${lastName}`,
      phoneNumber: this.generateColombianPhone(),
      legalId: this.generateLegalId(legalIdType),
      legalIdType,
    };
  }

  static generateAddressData(): GeneratedAddressData {
    const cityData = faker.helpers.arrayElement(this.colombianCities);

    return {
      addressLine1: `${faker.location.streetAddress()} ${faker.number.int({
        min: 1,
        max: 200,
      })}-${faker.number.int({ min: 1, max: 99 })}`,
      city: cityData.city,
      department: cityData.region,
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
    const rest = faker.number.int({ min: 100000000, max: 999999999 });
    return `${prefix}${rest}`;
  }

  private static generateLegalId(type: "CC" | "CE" | "NIT" | "PP"): string {
    switch (type) {
      case "CC": // Cédula de ciudadanía (6-10 digits)
        return faker.number.int({ min: 1000000, max: 9999999999 }).toString();
      case "CE": // Cédula de extranjería (6-7 digits)
        return faker.number.int({ min: 100000, max: 9999999 }).toString();
      case "NIT": // NIT (9-10 digits)
        return faker.number.int({ min: 100000000, max: 9999999999 }).toString();
      case "PP": // Passport
        return faker.string.alphanumeric(8).toUpperCase();
      default:
        return faker.number.int({ min: 1000000, max: 9999999999 }).toString();
    }
  }

  static generateCompanyData() {
    const companyName = faker.company.name();

    return {
      customerData: {
        email: faker.internet.email({ firstName: companyName }).toLowerCase(),
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
