package taskflow

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._
import java.util.UUID

/**
 * PT-GA-01/02 — Gatling Load Simulation
 * Realistic mixed workload: 300 concurrent users, 10-minute sustained run.
 * Generates an HTML simulation report in target/gatling/.
 *
 * Run:
 *   cd tests/performance/gatling
 *   mvn gatling:test -Dgatling.simulationClass=taskflow.LoadSimulation \
 *       -DBASE_URL=http://localhost:8080
 */
class LoadSimulation extends Simulation {

  val baseUrl = System.getProperty("BASE_URL", "http://localhost:8080")

  val httpProtocol = http
    .baseUrl(baseUrl)
    .acceptHeader("application/json")
    .contentTypeHeader("application/json")
    .acceptEncodingHeader("gzip, deflate")
    .userAgentHeader("Gatling/TaskFlowPro-LoadTest")
    .shareConnections   // share HTTP connections between VUs for realistic pool behaviour

  // ── Shared token feeder: each VU registers & logs in once ─────────────────
  val authFeeder = Iterator.continually {
    val email = s"gatling_load_${UUID.randomUUID().toString.take(8)}@perf.test"
    Map("email" -> email, "password" -> "GatlingPass123!", "fullName" -> "Gatling Load User")
  }

  // ── Auth chain ────────────────────────────────────────────────────────────
  val authChain = exec(
    http("Register")
      .post("/api/v1/auth/register")
      .body(StringBody("""{"fullName":"${fullName}","email":"${email}","password":"${password}"}"""))
      .check(status.in(201, 409))
  ).exec(
    http("Login")
      .post("/api/v1/auth/login")
      .body(StringBody("""{"email":"${email}","password":"${password}"}"""))
      .check(
        status.is(200),
        jsonPath("$.accessToken").saveAs("accessToken"),
        jsonPath("$.refreshToken").saveAs("refreshToken")
      )
  )

  // ── Read scenario (60 % of traffic) ──────────────────────────────────────
  val readScenario = scenario("Read Workload")
    .feed(authFeeder)
    .exec(authChain)
    .repeat(20) {
      exec(
        http("GET /projects")
          .get("/api/v1/projects")
          .header("Authorization", "Bearer ${accessToken}")
          .check(status.is(200))
      )
      .pause(500.milliseconds, 1.second)
      .exec(
        http("GET /tasks/my-tasks")
          .get("/api/v1/tasks/my-tasks")
          .header("Authorization", "Bearer ${accessToken}")
          .check(status.is(200))
      )
      .pause(500.milliseconds, 1.second)
      .exec(
        http("GET /notifications")
          .get("/api/v1/notifications")
          .header("Authorization", "Bearer ${accessToken}")
          .check(status.is(200))
      )
      .pause(1.second, 2.seconds)
    }

  // ── Write scenario (30 % of traffic) ─────────────────────────────────────
  val writeScenario = scenario("Write Workload")
    .feed(authFeeder)
    .exec(authChain)
    // Create a project once per VU
    .exec(
      http("POST /projects")
        .post("/api/v1/projects")
        .header("Authorization", "Bearer ${accessToken}")
        .body(StringBody("""{"name":"Gatling Project ${email}","description":"Load test"}"""))
        .check(status.is(201), jsonPath("$.id").saveAs("projectId"))
    )
    .repeat(10) {
      exec(
        http("POST /tasks")
          .post("/api/v1/projects/${projectId}/tasks")
          .header("Authorization", "Bearer ${accessToken}")
          .body(StringBody("""{"title":"Gatling Task","priority":"MEDIUM"}"""))
          .check(status.is(201), jsonPath("$.id").saveAs("taskId"))
      )
      .pause(300.milliseconds)
      .exec(
        http("PATCH /tasks/:id/status")
          .patch("/api/v1/tasks/${taskId}/status")
          .header("Authorization", "Bearer ${accessToken}")
          .body(StringBody("""{"status":"IN_PROGRESS"}"""))
          .check(status.is(200))
      )
      .pause(500.milliseconds, 1.second)
    }

  // ── Dashboard scenario (10 % of traffic) ─────────────────────────────────
  val dashboardScenario = scenario("Dashboard Workload")
    .feed(authFeeder)
    .exec(authChain)
    .repeat(30) {
      exec(
        http("GET /dashboard/summary")
          .get("/api/v1/dashboard/summary")
          .header("Authorization", "Bearer ${accessToken}")
          .check(status.is(200))
      )
      .pause(2.seconds, 4.seconds)
    }

  // ── Injection profile ─────────────────────────────────────────────────────
  setUp(
    readScenario.inject(
      rampUsers(180).during(2.minutes),     // 60% of 300 peak VUs
      constantUsersPerSec(30).during(8.minutes)
    ),
    writeScenario.inject(
      nothingFor(1.minute),
      rampUsers(90).during(2.minutes),      // 30% of 300
      constantUsersPerSec(15).during(7.minutes)
    ),
    dashboardScenario.inject(
      nothingFor(30.seconds),
      rampUsers(30).during(2.minutes),      // 10% of 300
      constantUsersPerSec(5).during(7.5.minutes)
    )
  )
  .protocols(httpProtocol)
  .assertions(
    global.responseTime.percentile(95).lt(300),
    global.successfulRequests.percent.gte(99.0)
  )
}
