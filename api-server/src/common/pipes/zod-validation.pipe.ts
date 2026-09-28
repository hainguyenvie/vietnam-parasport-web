import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";
import { ZodError } from "zod";

interface ZodLike {
  parse: (value: unknown) => any;
}

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodLike) {}

  transform(value: unknown) {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.issues.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        throw new BadRequestException({
          success: false,
          message: "Validation failed",
          errors: messages,
        });
      }
      throw error;
    }
  }
}

/** Factory: creates a validation pipe from a Zod schema */
export const ZodPipe = (schema: ZodLike) => new ZodValidationPipe(schema);
