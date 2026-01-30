pipeline {
    agent any

    environment {
        IMAGE_NAME = "lf-build"
        CONTAINER_NAME = "lf-temp"
        AWS_DEFAULT_REGION = "ap-south-1"
        S3_BUCKET = "lost-and-found-portal-0075"
        CLOUDFRONT_DIST_ID = "E21U866ELWESC5"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                docker build -t $IMAGE_NAME .
                '''
            }
        }

        stage('Extract Build Folder') {
            steps {
                sh '''
                docker rm -f $CONTAINER_NAME || true
                docker create --name $CONTAINER_NAME $IMAGE_NAME
                rm -rf build
                docker cp $CONTAINER_NAME:/app/build ./build
                '''
            }
        }

        stage('Deploy to S3') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-jenkins'
                ]]) {
                    sh '''
                    aws s3 sync build/ s3://$S3_BUCKET/ --delete
                    '''
                }
            }
        }

        stage('Invalidate CloudFront') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-jenkins'
                ]]) {
                    sh '''
                    aws cloudfront create-invalidation \
                      --distribution-id $CLOUDFRONT_DIST_ID \
                      --paths "/*"
                    '''
                }
            }
        }

        stage('Cleanup') {
            steps {
                sh '''
                docker rm -f $CONTAINER_NAME || true
                docker rmi $IMAGE_NAME || true
                '''
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}

