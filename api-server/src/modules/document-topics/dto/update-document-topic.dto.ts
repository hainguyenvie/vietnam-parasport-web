import { PartialType } from "@nestjs/mapped-types";
import { CreateDocumentTopicDto } from "./create-document-topic.dto";

export class UpdateDocumentTopicDto extends PartialType(CreateDocumentTopicDto) {}
