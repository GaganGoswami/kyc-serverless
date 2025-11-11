package com.kyc.agents;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
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
 * IdentityVerificationAgent
 * 
 * Verifies customer identity by:
 * - Cross-referencing document data with external databases
 * - Validating personal information
 * - Checking document authenticity
 * - Performing liveness detection (if applicable)
 * 
 * Publishes Identity.Verified event to EventBridge on success.
 */
public class IdentityVerificationAgent implements RequestHandler<Map<String, Object>, KYCEvent> {
    private static final Logger logger = LoggerFactory.getLogger(IdentityVerificationAgent.class);
    private static final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
    
    private final DynamoDbClient dynamoDbClient;
    private final EventBridgeClient eventBridgeClient;
    private final String tableName;
    private final String eventBusName;
    
    public IdentityVerificationAgent() {
        this.dynamoDbClient = DynamoDbClient.create();
        this.eventBridgeClient = EventBridgeClient.create();
        this.tableName = System.getenv("TABLE_NAME");
        this.eventBusName = System.getenv("EVENT_BUS_NAME");
    }
    
    @Override
    public KYCEvent handleRequest(Map<String, Object> input, Context context) {
        logger.info("IdentityVerificationAgent invoked: {}", input);
        
        try {
            // Extract validation result from previous step
            Map<String, Object> validationResult = extractValidationResult(input);
            String customerId = (String) validationResult.get("customerId");
            String documentUrl = (String) validationResult.get("documentUrl");
            
            logger.info("Processing identity verification for customer: {}", customerId);
            
            // Perform identity verification (mock logic)
            boolean isVerified = verifyIdentity(customerId, documentUrl);
            double verificationScore = calculateVerificationScore(customerId);
            
            // Create KYC event
            KYCEvent event = KYCEvent.builder()
                .customerId(customerId)
                .eventType("Identity.Verified")
                .kycStatus(isVerified ? KYCStatus.VERIFIED : KYCStatus.FAILED)
                .documentUrl(documentUrl)
                .verificationScore(verificationScore)
                .isVerified(isVerified)
                .lastUpdated(Instant.now().toString())
                .metadata(String.format("Identity verified with score: %.2f", verificationScore))
                .build();
            
            // Store in DynamoDB
            storeToDynamoDB(event);
            
            // Publish event to EventBridge
            if (isVerified) {
                publishEvent(event);
            }
            
            logger.info("Identity verification completed for customer: {} - Verified: {}", customerId, isVerified);
            return event;
            
        } catch (Exception e) {
            logger.error("Error in IdentityVerificationAgent", e);
            throw new RuntimeException("Identity verification failed", e);
        }
    }
    
    private Map<String, Object> extractValidationResult(Map<String, Object> input) {
        // Extract from Step Functions input
        if (input.containsKey("validationResult")) {
            Map<String, Object> validationResult = (Map<String, Object>) input.get("validationResult");
            return (Map<String, Object>) validationResult.get("Payload");
        }
        return input;
    }
    
    private boolean verifyIdentity(String customerId, String documentUrl) {
        // Mock verification logic
        // In production: 
        // - Extract data from document using OCR (Textract)
        // - Cross-reference with government databases
        // - Perform facial recognition (Rekognition)
        // - Validate document security features
        logger.info("Verifying identity for customer: {}", customerId);
        
        // Simulate verification (90% success rate)
        return Math.random() > 0.10;
    }
    
    private double calculateVerificationScore(String customerId) {
        // Mock scoring logic
        // In production: aggregate scores from multiple verification checks
        return 0.70 + (Math.random() * 0.30); // Score between 0.70 and 1.0
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
                .source("kyc.verification")
                .detailType("Identity.Verified")
                .detail(eventDetail)
                .build();
            
            PutEventsRequest request = PutEventsRequest.builder()
                .entries(eventEntry)
                .build();
            
            eventBridgeClient.putEvents(request);
            logger.info("Published Identity.Verified event to EventBridge");
            
        } catch (Exception e) {
            logger.error("Failed to publish event", e);
        }
    }
}
