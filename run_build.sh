#!/bin/bash
cd android
./gradlew assembleDebug -x lint -x test --stacktrace --info > ../build.log 2>&1
