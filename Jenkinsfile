pipeline {
    agent any

    environment {
        IMAGE_NAME = "lf-build"
        CONTAINER_NAME = "lf-temp"
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
