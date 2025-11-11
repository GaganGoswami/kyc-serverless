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
 * FraudDetectionAgent
 * 
 * Detects potential fraud by analyzing:
 * - Document tampering indicators
 * - Suspicious patterns in customer data
 * - Historical fraud databases
 * - Behavioral biometrics
 * - Geographic anomalies
 * 
 * Publishes Fraud.Checked event to EventBridge.
 */
public class FraudDetectionAgent implements RequestHandler<Map<String, Object>, KYCEvent> {
    private static final Logger logger = LoggerFactory.getLogger(FraudDetectionAgent.class);
    private static final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
    
    private final DynamoDbClient dynamoDbClient;
    private final EventBridgeClient eventBridgeClient;
    private final String tableName;
    private final String eventBusName;
    
    public FraudDetectionAgent() {
        this.dynamoDbClient = DynamoDbClient.create();
        this.eventBridgeClient = EventBridgeClient.create();
        this.tableName = System.getenv("TABLE_NAME");
        this.eventBusName = System.getenv("EVENT_BUS_NAME");
    }
    
    @Override
    public KYCEvent handleRequest(Map<String, Object> input, Context context) {
        logger.info("FraudDetectionAgent invoked: {}", input);
        
        try {
            // Extract verification result from previous step
            Map<String, Object> verificationResult = extractVerificationResult(input);
            String customerId = (String) verificationResult.get("customerId");
            String documentUrl = (String) verificationResult.get("documentUrl");
            
            logger.info("Processing fraud detection for customer: {}", customerId);
            
            // Perform fraud detection (mock logic)
            boolean fraudDetected = detectFraud(customerId, documentUrl);
            double fraudScore = calculateFraudScore(customerId);
            
            // Create KYC event
            KYCEvent event = KYCEvent.builder()
                .customerId(customerId)
                .eventType("Fraud.Checked")
                .kycStatus(fraudDetected ? KYCStatus.FRAUD_DETECTED : KYCStatus.VERIFIED)
                .documentUrl(documentUrl)
                .fraudScore(fraudScore)
                .fraudDetected(fraudDetected)
                .lastUpdated(Instant.now().toString())
                .metadata(String.format("Fraud check completed - Risk score: %.2f", fraudScore))
                .build();
            
            // Store in DynamoDB
            storeToDynamoDB(event);
            
            // Publish event to EventBridge
            publishEvent(event);
            
            logger.info("Fraud detection completed for customer: {} - Fraud detected: {}", customerId, fraudDetected);
            return event;
            
        } catch (Exception e) {
            logger.error("Error in FraudDetectionAgent", e);
            throw new RuntimeException("Fraud detection failed", e);
        }
    }
    
    private Map<String, Object> extractVerificationResult(Map<String, Object> input) {
        // Extract from Step Functions input
        if (input.containsKey("verificationResult")) {
            Map<String, Object> verificationResult = (Map<String, Object>) input.get("verificationResult");
            return (Map<String, Object>) verificationResult.get("Payload");
        }
        return input;
    }
    
    private boolean detectFraud(String customerId, String documentUrl) {
        // Mock fraud detection logic
        // In production:
        // - Analyze document for tampering signs
        // - Check against fraud databases
        // - Detect anomalous patterns
        // - Verify document security features
        // - Check IP/location consistency
        logger.info("Detecting fraud for customer: {}", customerId);
        
        // Simulate fraud detection (5% fraud rate)
        return Math.random() < 0.05;
    }
    
    private double calculateFraudScore(String customerId) {
        // Mock fraud scoring
        // In production: aggregate risk indicators from multiple sources
        // Score: 0.0 = no risk, 1.0 = high risk
        double baseScore = Math.random() * 0.3; // Most customers have low risk (0.0-0.3)
        
        // Occasionally generate higher risk scores
        if (Math.random() < 0.05) {
            baseScore = 0.7 + (Math.random() * 0.3); // High risk (0.7-1.0)
        }
        
        return baseScore;
    }
    
    private void storeToDynamoDB(KYCEvent event) {
        Map<String, AttributeValue> item = new HashMap<>();
        item.put("customerId", AttributeValue.builder().s(event.getCustomerId()).build());
        item.put("eventType", AttributeValue.builder().s(event.getEventType()).build());
        item.put("kycStatus", AttributeValue.builder().s(event.getKycStatus().name()).build());
        item.put("documentUrl", AttributeValue.builder().s(event.getDocumentUrl()).build());
        item.put("fraudScore", AttributeValue.builder().n(event.getFraudScore().toString()).build());
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
                .source("kyc.fraud")
                .detailType("Fraud.Checked")
                .detail(eventDetail)
                .build();
            
            PutEventsRequest request = PutEventsRequest.builder()
                .entries(eventEntry)
                .build();
            
            eventBridgeClient.putEvents(request);
            logger.info("Published Fraud.Checked event to EventBridge");
            
        } catch (Exception e) {
            logger.error("Failed to publish event", e);
        }
    }
}
