package com.kyc.agents;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.S3Event;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.kyc.model.KYCEvent;
import com.kyc.model.KYCEvent.KYCStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.eventbridge.EventBridgeClient;
import software.amazon.awssdk.services.eventbridge.model.PutEventsRequest;
import software.amazon.awssdk.services.eventbridge.model.PutEventsRequestEntry;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * DocumentValidationAgent
 * 
 * Validates uploaded KYC documents for:
 * - File format compliance (PDF, JPEG, PNG)
 * - File size limits
 * - Basic document quality checks
 * - Metadata extraction
 * 
 * Publishes Document.Validated event to EventBridge on success.
 */
public class DocumentValidationAgent implements RequestHandler<Map<String, Object>, KYCEvent> {
    private static final Logger logger = LoggerFactory.getLogger(DocumentValidationAgent.class);
    private static final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
    
    private final DynamoDbClient dynamoDbClient;
    private final EventBridgeClient eventBridgeClient;
    private final String tableName;
    private final String eventBusName;
    
    public DocumentValidationAgent() {
        this.dynamoDbClient = DynamoDbClient.create();
        this.eventBridgeClient = EventBridgeClient.create();
        this.tableName = System.getenv("TABLE_NAME");
        this.eventBusName = System.getenv("EVENT_BUS_NAME");
    }
    
    @Override
    public KYCEvent handleRequest(Map<String, Object> input, Context context) {
        logger.info("DocumentValidationAgent invoked: {}", input);
        
        try {
            // Extract customer info from input
            String customerId = extractCustomerId(input);
            String documentUrl = extractDocumentUrl(input);
            
            logger.info("Processing document validation for customer: {}", customerId);
            
            // Perform validation (mock logic)
            boolean isValid = validateDocument(documentUrl);
            double validationScore = calculateValidationScore(documentUrl);
            
            // Create KYC event
            KYCEvent event = KYCEvent.builder()
                .customerId(customerId)
                .eventType("Document.Validated")
                .kycStatus(isValid ? KYCStatus.VALIDATED : KYCStatus.FAILED)
                .documentUrl(documentUrl)
                .verificationScore(validationScore)
                .isValid(isValid)
                .lastUpdated(Instant.now().toString())
                .metadata(String.format("Document validated with score: %.2f", validationScore))
                .build();
            
            // Store in DynamoDB
            storeToDynamoDB(event);
            
            // Publish event to EventBridge
            if (isValid) {
                publishEvent(event);
            }
            
            logger.info("Document validation completed for customer: {} - Valid: {}", customerId, isValid);
            return event;
            
        } catch (Exception e) {
            logger.error("Error in DocumentValidationAgent", e);
            throw new RuntimeException("Document validation failed", e);
        }
    }
    
    private String extractCustomerId(Map<String, Object> input) {
        // Extract from S3 event or Step Function input
        if (input.containsKey("customerId")) {
            return (String) input.get("customerId");
        }
        
        // Extract from S3 key pattern: uploads/{customerId}/{filename}
        if (input.containsKey("Records")) {
            // S3 event
            return "customer-" + System.currentTimeMillis();
        }
        
        return "unknown-customer";
    }
    
    private String extractDocumentUrl(Map<String, Object> input) {
        if (input.containsKey("documentUrl")) {
            return (String) input.get("documentUrl");
        }
        return "s3://bucket/uploads/document.pdf";
    }
    
    private boolean validateDocument(String documentUrl) {
        // Mock validation logic
        // In production: check file format, size, quality, extract metadata
        logger.info("Validating document: {}", documentUrl);
        
        // Simulate validation (95% success rate)
        return Math.random() > 0.05;
    }
    
    private double calculateValidationScore(String documentUrl) {
        // Mock scoring logic
        // In production: analyze document quality, completeness, clarity
        return 0.75 + (Math.random() * 0.25); // Score between 0.75 and 1.0
    }
    
    private void storeToDynamoDB(KYCEvent event) {
        Map<String, AttributeValue> item = new HashMap<>();
        item.put("customerId", AttributeValue.builder().s(event.getCustomerId()).build());
        item.put("eventType", AttributeValue.builder().s(event.getEventType()).build());
        item.put("kycStatus", AttributeValue.builder().s(event.getKycStatus().name()).build());
        item.put("documentUrl", AttributeValue.builder().s(event.getDocumentUrl()).build());
        item.put("verificationScore", AttributeValue.builder().n(event.getVerificationScore().toString()).build());
        item.put("lastUpdated", AttributeValue.builder().s(event.getLastUpdated()).build());
        item.put("metadata", AttributeValue.builder().s(event.getMetadata()).build());
        
        PutItemRequest request = PutItemRequest.builder()
            .tableName(tableName)
            .item(item)
            .build();
        
        dynamoDbClient.putItem(request);
        logger.info("Stored event to DynamoDB: {}", event.getEventType());
    }
    
    private void publishEvent(KYCEvent event) {
        try {
            String eventDetail = objectMapper.writeValueAsString(event);
            
            PutEventsRequestEntry eventEntry = PutEventsRequestEntry.builder()
                .eventBusName(eventBusName)
                .source("kyc.validation")
                .detailType("Document.Validated")
                .detail(eventDetail)
                .build();
            
            PutEventsRequest request = PutEventsRequest.builder()
                .entries(eventEntry)
                .build();
            
            eventBridgeClient.putEvents(request);
            logger.info("Published Document.Validated event to EventBridge");
            
        } catch (Exception e) {
            logger.error("Failed to publish event", e);
        }
    }
}
