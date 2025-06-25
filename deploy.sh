#!/bin/bash
set -e

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    export $(cat .env | grep -v '^#' | xargs)
fi
# Check required environment variables

if [ -z "$GOOGLE_PROJECT_ID" ]; then
    echo "❌ Error: GOOGLE_PROJECT_ID environment variable is not set"
    echo "Please set it in your .env file or export it in your shell"
    exit 1
fi


# Check Docker-related environment variables
if [ -z "$DOCKER_REPO" ]; then
    echo "❌ Error: DOCKER_REPO environment variable is not set"
    echo "Please set it in your .env file or export it in your shell"
    exit 1
fi

if [ -z "$IMAGE_NAME" ]; then
    echo "❌ Error: IMAGE_NAME environment variable is not set"
    echo "Please set it in your .env file or export it in your shell"
    exit 1
fi

if [ -z "$IMAGE_TAG" ]; then
    echo "❌ Error: IMAGE_TAG environment variable is not set"
    echo "Please set it in your .env file or export it in your shell"
    exit 1
fi

if [ -z "$CLOUD_RUN_SERVICE_NAME" ]; then
    echo "❌ Error: CLOUD_RUN_SERVICE_NAME environment variable is not set"
    echo "Please set it in your .env file or export it in your shell"
    exit 1
fi

echo "✅ All required environment variables are set"
echo "🐳 Docker Repo: $DOCKER_REPO"
echo "📦 Image Name: $IMAGE_NAME"
echo "🏷️  Image Tag: $IMAGE_TAG"
echo "🔨 Cloud Run Service Name: $CLOUD_RUN_SERVICE_NAME"

IMAGE="europe-north1-docker.pkg.dev/$GOOGLE_PROJECT_ID/$DOCKER_REPO/$IMAGE_NAME:$IMAGE_TAG"

echo "🔨 Building Docker image..."
docker build --no-cache -t$IMAGE_NAME:$IMAGE_TAG .
docker tag $IMAGE_NAME:$IMAGE_TAG $IMAGE

echo "📤 Pushing image to Google Container Registry..."
docker push $IMAGE

echo "🚀 Deploying to Google Cloud Run..."
gcloud run deploy $CLOUD_RUN_SERVICE_NAME \
    --image $IMAGE \
    --platform managed \
    --region europe-north1 \
    --allow-unauthenticated 
    --verbosity=debug

echo "✅ Deployment completed successfully!"