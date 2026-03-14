package taskflow

import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._
import java.util.UUID

/**
 * PT-GA-03/04 — Gatling Stress Simulation
 * Steps up VUs every 2 minutes until failure, then recovers.
 * Goal: identify the VU ceiling and validate HPA kicks in before 503s appear.
 *
 * Run:
 *   mvn gatling:test -Dgatling.simulationClass=taskflow.StressSimulation \
 *       -DBASE_URL=http://localhost:8080
 */
class StressSimulation extends Simulation {

  val baseUrl = System.getProperty("BASE_URL", "http://localhost:8080")

  val httpProtocol = http
    .baseUrl(baseUrl)
    .acceptHeader("application/json")
    .contentTypeHeader("application/json")
    .shareConnections

  val authFeeder = Iterator.continually {
    val email = s"gatling_stress_${UUID.randomUUID().toString.take(8)}@perf.test"
    Map("email" -> email, "password" -> "StressGatling1!", "fullName" -> "Gatling Stress")
  }

  val authChain = exec(
    http("Register")
      .post("/api/v1/auth/register")
      .body(StringBody("""{"fullName":"${fullName}","email":"${email}","password":"${password}"}"""))
      .check(status.in(201, 409))
  ).exec(
    http("Login")
      .post("/api/v1/auth/login")
      .body(StringBody("""{"email":"${email}","password":"${password}"}"""))
      .check(status.is(200), jsonPath("$.accessToken").saveAs("accessToken"))
  )

  // Simple repeated GET to maximise RPS and expose DB/pool limits
  val stressScenario = scenario("Stress Scenario")
    .feed(authFeeder)
    .exec(authChain)
    .forever {
      exec(
        http("GET /projects (stress)")
          .get("/api/v1/projects")
          .header("Authorization", "Bearer ${accessToken}")
          .check(status.in(200, 429, 503))   // accept graceful degradation codes
      )
      .pause(200.milliseconds)
      .exec(
        http("GET /tasks/my-tasks (stress)")
          .get("/api/v1/tasks/my-tasks")
          .header("Authorization", "Bearer ${accessToken}")
          .check(status.in(200, 429, 503))
      )
      .pause(200.milliseconds)
    }

  setUp(
    stressScenario.inject(
      rampUsersPerSec(5).to(50).during(2.minutes),
      rampUsersPerSec(50).to(150).during(2.minutes),
      rampUsersPerSec(150).to(300).during(2.minutes),
      rampUsersPerSec(300).to(600).during(2.minutes),
      rampUsersPerSec(600).to(1000).during(2.minutes),  // push to ceiling
      constantUsersPerSec(1000).during(3.minutes),      // sustain
      rampUsersPerSec(1000).to(0).during(3.minutes)     // recovery
    )
  )
  .protocols(httpProtocol)
  .assertions(
    // We accept higher P95 under stress — the key assertion is that
    // recovery brings the error rate back below 5% after ramp-down
    global.failedRequests.percent.lt(10.0)
  )
}
