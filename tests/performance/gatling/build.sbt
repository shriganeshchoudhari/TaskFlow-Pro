// PT-GA-05 — Gatling build file (Maven alternative: use gatling-maven-plugin)
// Run: sbt gatling:testOnly taskflow.LoadSimulation
//      sbt gatling:testOnly taskflow.StressSimulation
//      BASE_URL=http://staging:8080 sbt gatling:test

val gatlingVersion = "3.10.3"

ThisBuild / scalaVersion := "2.13.12"

lazy val root = (project in file("."))
  .enablePlugins(GatlingPlugin)
  .settings(
    name    := "taskflow-gatling",
    version := "1.0.0",

    libraryDependencies ++= Seq(
      "io.gatling.highcharts" % "gatling-charts-highcharts" % gatlingVersion % "test",
      "io.gatling"            % "gatling-test-framework"    % gatlingVersion % "test",
    ),

    // Pass BASE_URL as a Java property: -DBASE_URL=http://...
    Gatling / jvmOptions := Seq(
      s"-DBASE_URL=${sys.props.getOrElse("BASE_URL", "http://localhost:8080")}",
      "-Xmx512m",
    ),

    addSbtPlugin("io.gatling" % "gatling-sbt" % "4.7.0"),
  )
